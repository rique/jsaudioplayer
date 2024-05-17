(function(window, document, JSPlayer, undefined) {

    const ListEvents = JSPlayer.EventsManager.ListEvents;
    const Track = JSPlayer.Tracks.Track;
    const ID3Tags = JSPlayer.Tracks.ID3Tags;
    const FileBrowserNotifications = JSPlayer.Notifications.FileBrowserNotifications;
    const clearElementInnerHTML = JSPlayer.Utils.clearElementInnerHTML;
    const Api = window.JSPlayer.Api;
    const TracklistBrowserNotifications = JSPlayer.Notifications.TracklistBrowserNotifications;
    const TrackListManager = JSPlayer.Tracks.TrackListManager;

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
        this._fileBrowserNotifications = FileBrowserNotifications;
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
            this.api.addTrack(fileName, this.baseDir + fileName, (res) => {
                let track = new Track(res['track']),
                    id3Tags = new ID3Tags(res['ID3']);
                track.setID3Tags(id3Tags);
                track.setTrackDuration(id3Tags.getDuration());
                TrackListManager.addTrackToList(track);
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

    const TrackListBrowser = function(audioPlayer, grid) {
        this._tracklistBrowserNotifications = TracklistBrowserNotifications;
        this.audioPlayer = audioPlayer;
        this.audioPlayer.onPlayerSongChange(this.setCurrentlyPlayingTrack.bind(this), this);
        this.grid = grid;
        this.overlayDiv = document.querySelector('.cnt-overlay');
        this.isVisible = false;
        TrackListManager.onAddedToQueue(this._notifyAddToQueue.bind(this));
        TrackListManager.onRemoveTrackFromTrackList(this._notifyARemovedTrack.bind(this));
        this.overlayDiv.addEventListener('click', (evt) => {
            if (evt.target != evt.currentTarget)
                return;
            if (this.isVisible) {
                this.hide();
            }
        });
    };
    TrackListBrowser.prototype = {
        setTracklist(tracklist) {
            this.tracklist = tracklist;
            this.tracklist.onAddedToQueue(this._notifyAddToQueue.bind(this));
            this.tracklist.onRemoveTrackFromTrackList(this._notifyARemovedTrack.bind(this));
        },
        setGrid(grid) {
            this.grid = grid;
        },
        show() {
            this.overlayDiv.style.display = 'block';
            this.isVisible = true;
            this.scrollToCurrentTrack();
        },
        hide() {
            this.overlayDiv.style.display = 'none';
            this.isVisible = false;
        },
        playSongFromTracklist(evt) {
            TrackListManager.getCurrentTrack().onTagChangeUnsub(this.audioPlayer);
            const cell = evt.detail.HTMLItem;
            TrackListManager.setTrackIndex(cell.getParentItem().getIndex() - 1, true);
        },
        showActionMenu(evt) {
            const target = evt.target;
            this.hideAllActionMenus();
            const previousMenu = document.querySelector(`.action-menu-cnt[data-track-id="${target.dataset.trackId}"]`);

            if (previousMenu) {
                return previousMenu.style.display = 'block';
            }
    
            const trackUUid = target.dataset.trackId;
            const divElem = document.createElement('div');
            const ulAction = document.createElement('ul');
            const liAddToQueue = document.createElement('li');
            const liDelete = document.createElement('li');
            const liFavorite = document.createElement('li');
    
            divElem.className = 'action-menu-cnt';
            divElem.dataset.trackId = trackUUid;
    
            liAddToQueue.innerText = 'Add to queue';
            liDelete.innerText = 'Remove track';
            liFavorite.innerText = 'Add to favorites';
    
            liAddToQueue.addEventListener('click', () => {
                this.addToQueueAction(divElem, trackUUid);
            });
    
            liDelete.addEventListener('click', () => {
                this.deleteTrackAction(liDelete, divElem, trackUUid);
            });
    
            liFavorite.addEventListener('click', () => {
                this.addToFavoriteAction(liFavorite, divElem, trackUUid);
            });
    
            ulAction.appendChild(liAddToQueue);
            ulAction.appendChild(liFavorite);
            ulAction.appendChild(liDelete);
            divElem.appendChild(ulAction);
    
            divElem.addEventListener('mouseleave', () => {
                this.hideActionMenu(divElem);
            });
    
            target.parentNode.appendChild(divElem);
        },
        hideActionMenu(divElem) {
            divElem.style.display = 'none';
        },
        hideAllActionMenus() {
            document.querySelectorAll('.action-menu-cnt').forEach(el => el.style.display = 'none');
        },
        addToQueueAction(divElem, trackUUid) {
            TrackListManager.addToQueue(TrackListManager.getTrackByUUID(trackUUid));
            divElem.style.display = 'none';
        },
        deleteTrackAction(liDelete, divElem, trackUUid) {
            const api = new window.JSPlayer.Api();
            api.deleteTrack(trackUUid, (res) => {
                if (res.success) {
                    const {trackIndx, track} = TrackListManager.removeTrackFromTracklistByUUID(trackUUid);
                    this.grid.removeRowFromGrid(trackIndx);
                    this.grid._displayTracklistInfo();
                } else
                    alert('Error deleting file!');
            });
        },
        addToFavoriteAction(liFavorite, divElem, trackUUid) {
            console.log('not implemented :|', trackUUid);
        },
        setCurrentlyPlayingTrack(track, index) {
            const row = this.grid.getRowByIndex(index);
            this.clearAllCurrentlyPlaying();
            row.classAdd("currently-playing");
            row.scrollTo(this.grid.getGrid().getParentCnt());
        },
        clearAllCurrentlyPlaying() {
            document.querySelectorAll('.currently-playing').forEach(el => el.classList.remove('currently-playing'));
        },
        scrollToCurrentTrack() {
            const currentlyPlaying = document.querySelector('div.row.currently-playing');
            console.log({currentlyPlaying});
            if (currentlyPlaying) {
                const scrollTo = currentlyPlaying.offsetTop - currentlyPlaying.offsetHeight;
                setTimeout(() => {
                    this.grid.getParentCnt().scrollTo({
                        behavior: 'smooth',
                        left: 0,
                        top: scrollTo,
                    });
                }, 0);
            }
        },
        _notifyAddToQueue(track) {
            this._tracklistBrowserNotifications.setAddedTrackToQueue(track);
        },
        _notifyARemovedTrack(track) {
            this._tracklistBrowserNotifications.setARemovedTrack(track);
        },
    }

    JSPlayer.Components = {
        LeftMenu,
        TrackListBrowser,
        FileBrowser,
        FileBrowserRenderer,
        Layout,
        layoutHTML,
    }

})(this, document, this.JSPlayer);