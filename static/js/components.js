(function(window, document, JSPlayer, undefined) {

    const ListEvents = JSPlayer.EventsManager.ListEvents;
    const Track = JSPlayer.Tracks.Track;
    const ID3Tags = JSPlayer.Tracks.ID3Tags;
    const FileBrowserNotifications = JSPlayer.Notifications.FileBrowserNotifications;
    const clearElementInnerHTML = JSPlayer.Utils.clearElementInnerHTML;
    const Api = window.JSPlayer.Api;

    const LeftMenu = function() {};
    LeftMenu.prototype = {
        init() {
            this.mainMenuElem = document.getElementById('main-left-menu');
            this.openMenuElem = document.getElementById('open-menu');
            this.leftMenuElement = document.getElementById('left-menu');
            this.openMenuElem.addEventListener('click', this.openClose.bind(this));
        },
        openClose() {
            if (this.mainMenuElem.classList.contains('is-open')) {
                this.close();
            } else {
                this.open();
            }
            this.mainMenuElem.classList.toggle('is-open');
        },
        open() {
            let maxRight = 0 - 1;
            let start = -(this.leftMenuElement.offsetWidth);
            let step = 30;
            this._slide.bind(this)(start, maxRight, step, this.mainMenuElem, 'right');
        },
        close() {
            let maxRight = -(this.leftMenuElement.offsetWidth) + 1;
            let start = 0;
            let step = -30;
            this._slide.bind(this)(start, maxRight, step, this.mainMenuElem, 'left');
        },
        _slide(start, maxRight, step, mainMenuElem, direction) {
            direction = direction || 'right';
            if ((start <= maxRight && direction == 'right') || (start >= maxRight && direction == 'left')) {
                if ((start > maxRight && direction == 'right') || (start < maxRight && direction == 'left'))
                    start = maxRight + 1;
                else
                    start += step;
                mainMenuElem.style.right = `${start}px`;
                requestAnimationFrame(this._slide.bind(this, start, maxRight, step, mainMenuElem, direction))
            }
        },
    };

    const Layout = function(parentElem, layoutName) {
        this.parentElem = parentElem;
        this.layoutName = layoutName;
    };
    Layout.prototype = {
        setParntElem(parentElem) {
            this.parentElem = parentElem;
        },
        getParentElem() {
            return this.parentElem;
        },
        setLayoutName(layoutName) {
            this.layoutName = layoutName;
        },
        getLayoutName() {
            return this.layoutName;
        },
        registerRenderCallback(cb) {
            this.renderCallback = cb; 
        },
        render() {
            this.renderCallback(this.parentElem);
        }
    };

    const LayoutHTML = function() {
        this.layouts = {};
    };
    LayoutHTML.prototype = {
        addHTMLLayout(layout) {
            this.layouts[layout.layoutName] = layout;
        },
        renderLayout(layoutName) {
            this.layouts[layoutName].render();
        }
    };

    const layoutHTML = new LayoutHTML();

    const FileBrowserRenderer = function(fileBrowser, layout, elemEvent) {
        this.fileBrowser = fileBrowser;
        this.layout = layout;
        this.elemEvent = elemEvent;
        this.layout.registerRenderCallback(this._render.bind(this));
        this._bindEVents();
        this._createElements();
    };
    FileBrowserRenderer.prototype = {
        _bindEVents() {
            this.elemEvent.addEventListener('click', (evt) => {
                this._displayFileBroserLayout();
                this.fileBrowser.loadFileBrowser.bind(this.fileBrowser)(evt);
            });
        },
        _createElements() {
            this.divBasePath = document.createElement('div');
            this.ulFolderList = document.createElement('ul');
            this.ulFileList = document.createElement('ul');
        },
        _displayFileBroserLayout() {
            layoutHTML.renderLayout(this.layout.layoutName);
        },
        _render(parentElem) {
            clearElementInnerHTML(parentElem);
            parentElem.className = 'file-browser';
            
            this.divBasePath.classList.add('base-path');
            this.ulFolderList.classList.add('folder-list');
            this.ulFileList.classList.add('file-list');
            
            parentElem.appendChild(this.divBasePath);
            parentElem.appendChild(this.ulFolderList);
            parentElem.appendChild(this.ulFileList);
    
            this.fileBrowser.setElementBoxes(parentElem, this.divBasePath, this.ulFolderList, this.ulFileList);
        }
    };
    

    const FileBrowser = function(player) {
        this.overlayDiv = document.querySelector('.cnt-overlay');
        this.baseDir = '/';
        this.api = new Api();
        this.browseHistory = [this.baseDir];
        this.historyIndex = 0;
        this.player = player;
        this.overlayDiv.addEventListener('click', this.closeFileBrowser.bind(this));
        this.folderBrowserEvent = new ListEvents();
        this._fileBrowserNotifications = new FileBrowserNotifications();
    };
    FileBrowser.prototype = {
        closeFileBrowser(evt) {
            if (evt.target != evt.currentTarget)
                return;
            if (this.isOpen)
                this._closeFileBrowser();
        },
        setElementBoxes(fileExplorerBox, basePathBox, folderListBox, fileListBox) {
            this.fileExplorerBox = fileExplorerBox;
            this.basePathBox = basePathBox;
            this.folderListBox = folderListBox;
            this.fileListBox = fileListBox;
        },
        folderSelector(evt) {
            let target = evt.target;
            let folderName = target.innerText.trim();
            console.log('foldername', folderName);
            
            if (folderName == '..') {
                let baseDirArray = this.baseDir.split('/');
                baseDirArray.splice((baseDirArray.length - 2), 1);
                this.baseDir = baseDirArray.join('/');
            } else
                this.baseDir += folderName;
    
            clearElementInnerHTML(this.folderListBox);
            clearElementInnerHTML(this.fileListBox);
            this.historyIndex++;
            this.browseHistory.push(this.baseDir);
            this.api.browseFiles(this.baseDir, this.fileBrowserCB.bind(this));
        },
        fileSelector(evt) {
            let target = evt.target;
            let fileName = target.textContent.trim();
            console.log('fileName', fileName);
            let tracklist = this.player.tracklist;
            this.api.addTrack(fileName, this.baseDir + fileName, (res) => {
                let track = new Track(res['track']),
                    id3Tags = new ID3Tags(res['ID3']);
                track.setID3Tags(id3Tags);
                track.setTrackDuration(id3Tags.getDuration());
                tracklist.addTrackToList(track);
                this._fileBrowserNotifications.setAddedTrack(track, 6000);
                this.folderBrowserEvent.trigger('onSongAdded', track, this.player.getTrackList().getTracksNumber() - 1);
            });
        },
        fileBrowserCB(res) {
            this._openFileBrowser();
            this.basePathBox.innerText = res['base_dir'];
            if (res['dir_list'].length > 0) {
                for (let dirName of res['dir_list']) {
                    let liElem = document.createElement('li');
                    liElem.classList.add('fld-itm');
                    liElem.innerHTML = `<li class="fa-solid fa-folder"></li> ${dirName}`;
                    liElem.addEventListener('dblclick', this.folderSelector.bind(this));
                    this.folderListBox.appendChild(liElem);
                }
            }
            
            if (res['file_list'].length > 0) {
                for (let fileName of res['file_list']) {
                    let liElem = document.createElement('li');
                    liElem.classList.add('fle-itm');
                    liElem.innerHTML = `<li class="fa-solid fa-file"></li> ${fileName}`;
                    liElem.addEventListener('dblclick', this.fileSelector.bind(this));
                    this.fileListBox.appendChild(liElem);
                }
            }
        },
        loadFileBrowser() {
            this.api.browseFiles(this.baseDir, this.fileBrowserCB.bind(this))
        },
        onSongAdded(cb, subscriber) {
            this.folderBrowserEvent.onEventRegister({'cb': (track, idx) => {
                cb(track, idx);
            }, subscriber}, 'onSongAdded');
        },
        _closeFileBrowser() {
            this.isOpen = false;
            clearElementInnerHTML(this.folderListBox);
            clearElementInnerHTML(this.fileListBox);
            this.overlayDiv.style.display = 'none';
            this.fileExplorerBox.style.display = 'none';
        },
        _openFileBrowser() {
            this.isOpen = true;
            this.overlayDiv.style.display = 'block';
            this.fileExplorerBox.style.display = 'block';
        },
    };

    JSPlayer.Components = {
        LeftMenu,
        FileBrowser,
        FileBrowserRenderer,
        Layout,
        layoutHTML,
    }

})(this, document, this.JSPlayer);