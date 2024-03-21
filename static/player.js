// slideUp(litsItemUl, listItemsElem, maxHeight, 40);
const slideUp = function (elem, parentElem, maxHeight, step, currentHeight, cb) {
    let style = elem.style,
        parentStyle = parentElem.style;
    if (typeof currentHeight === 'undefined')
        currentHeight = 0;

    if (currentHeight < maxHeight) {
        currentHeight += step;
        parentStyle.maxHeight = style.maxHeight = (currentHeight).toString() + 'px' ;
        return requestAnimationFrame(slideUp.bind(this, elem, parentElem, maxHeight, step, currentHeight));
    }

    parentStyle.maxHeight = style.maxHeight = (maxHeight).toString() + 'px';
    if (typeof cb === 'function')
        return cb();
};


// slideDown(litsItemUl, listItemsElem, maxHeight, 40);
const slideDown = function (elem, parentElem, startHeight, step, currentHeight, cb) {
    let style = elem.style,
        parentStyle = parentElem.style;
    currentHeight = typeof currentHeight  === 'number' ? currentHeight : startHeight;

    if (currentHeight > 0) {
        currentHeight -= step;
        parentStyle.maxHeight = style.maxHeight = (currentHeight).toString() + 'px' ;
        return requestAnimationFrame(slideDown.bind(this, elem, parentElem, startHeight, step, currentHeight, cb));
    }

    style.maxHeight = (startHeight).toString() + 'px';
    parentStyle.maxHeight = '0px';

    if (typeof cb === 'function')
        return cb();
};


const readCookie = function (name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};


const blob2Uint8Array = (blob) => {
    return new Response(blob).arrayBuffer().then(buffer=> {
        return [...new Uint8Array(buffer)];
    });
};


const clearElementInnerHTML = (element) => {
    while(element.firstChild)
        element.removeChild(element.firstChild);
}


const Api = function() {
    this.url = 'http://localhost:8888/api';
    this.xhr = new XMLHttpRequest();
    this.csrftoken = readCookie('csrftoken');
}

Api.prototype = {
    getXhrPost(url) {
        this.xhr.open('POST', url, true);
        return this.xhr; 
    },
    getXhrGet(url) {
        this.xhr.open('GET', url, true);
        return this.xhr; 
    },
    browseFiles(baseDir, callback) {
        let xhr = this.getXhrPost(`${this.url}/file-browser`);
        let data = JSON.stringify({
            'base_dir': baseDir
        });

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.setRequestHeader("X-CSRFToken", this.csrftoken);
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    addTrack(trackName, trackFullPath, callback) {
        let xhr = this.getXhrPost(`${this.url}/add-track`);
        let data = JSON.stringify({
            track_name: trackName,
            track_original_path: trackFullPath
        });

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.setRequestHeader("X-CSRFToken", this.csrftoken);
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    loadTrackList(callback) {
        let xhr = this.getXhrPost(`${this.url}/load-track-list`);
        let data = JSON.stringify({});

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.setRequestHeader("X-CSRFToken", this.csrftoken);
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    loadBGImages(callback) {
        let xhr = this.getXhrGet(`${this.url}/load-bg-img`);
        xhr.send();

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    }
};


const Track = function(trackInfo) {
    this.trackName = trackInfo.track_name;
    this.trackUUid = trackInfo.track_uuid;
    this.trackOriginalPath = trackInfo.track_original_path;
    this.trackDuration = undefined;
}
Track.prototype = {
    setTrackDuration(duration) {
        this.trackDuration = duration;
    }
};


const TrackList = function(tracklist) {
    this.tracklist = tracklist || [];
    this.trackIndex = 0;
    this.tracksNumber = this.tracklist.length;
    if (this.tracklist.length > 0)
        this.currentTrack = this.tracklist[this.trackIndex];
    else
        this.currentTrack = null;
}
TrackList.prototype = {
    getTrackLis() {
        return this.tracklist;
    },
    setTrackList(tracklist) {
        this.tracklist = tracklist;
        this.trackIndex = 0;
        this.tracksNumber = tracklist.length;
        this.currentTrack = this.tracklist[this.trackIndex];
    },
    addTrackToList(track) {
        this.tracklist.push(track);
        ++this.tracksNumber;
    },
    getCurrentTrack() {
        if (this.currentTrack != null)
            return this.currentTrack;
        if (this.tracksNumber > 0)
            return this.tracklist[this.trackIndex];
        return null;
    },
    advanceTrack() {
        this._advanceTrackIndex();
        this._setCurrentTrack();
        console.log('advance', this.trackIndex, this.currentTrack, this.tracksNumber);
        return this.getCurrentTrack(); 
    },
    regressTrack() {
        this._regressTrackIndex();
        this._setCurrentTrack();
        return this.getCurrentTrack();
    },
    isLastTrack() {
        return this.trackIndex == (this.tracksNumber - 1);
    },
    resetTrackListIndex() {
        this.trackIndex = 0;
        this._setCurrentTrack();
    },
    setTrackIndex(indexVal) {
        this.trackIndex = indexVal;
    },
    _setCurrentTrack() {
        this.currentTrack = this.tracklist[this.trackIndex];
    },
    _advanceTrackIndex() {
        console.log('INDEX ADVANCE 1', this.trackIndex, this.tracksNumber - 1);
        if (this.trackIndex < (this.tracksNumber - 1))
            ++this.trackIndex;
        else
            this.trackIndex = 0;
        console.log('INDEX ADVANCE 2', this.trackIndex, this.tracksNumber - 1);
    },
    _regressTrackIndex() {
        if (this.trackIndex > 0)
            --this.trackIndex;
        else
            this.trackIndex = this.tracksNumber - 1;
    },
}


const AudioPlayer = function(tracklist, api) {
    if (!tracklist) {
        console.error('No tracklist provided');
        throw 'No tracklist provided';
    }
        
    this.tracklist = tracklist;
    
    this.repeat = true;
    this.repeatElem = document.querySelector('#repeat-button a');

    this.albumImg = document.getElementById('album-art');
    this.titleTrack = document.getElementById('track-title');
    this.titleAlbum = document.getElementById('album-title');

    this.playBtn = document.getElementById('play-button');
    this.pauseBtn = document.getElementById('pause-button');
    this.stopBtn = document.getElementById('stop-button');
    this.prevBtn = document.getElementById('prev-button');
    this.nextBtn = document.getElementById('next-button');

    this.progressBarDiv = document.getElementById('prog-bar');

    this.audioEle = new Audio();
    this.jsmediatags = window.jsmediatags;
    this.api = api;
}

AudioPlayer.prototype = {
    init() {
        let currentTrack = this.tracklist.getCurrentTrack();
        console.log('this.tracklist', this.tracklist, currentTrack);
        this.loadID3Tags(currentTrack.trackUUid);
        this.audioEle.src = `/static/${currentTrack.trackUUid}.mp3`;
        this.audioEle.autoplay = false;
        this.audioEle.preload = "auto";
        this.audioEle.onloadedmetadata = this.onAudioLoaded.bind(this);
        this.audioEle.onended = this.onAudioEnded.bind(this);
        
        this.playBtn.addEventListener('click', function(evt) {
            evt.preventDefault();
            this.play();
        }.bind(this));

        this.pauseBtn.addEventListener('click', function(evt) {
            evt.preventDefault();
            this.pause();
        }.bind(this));

        this.stopBtn.addEventListener('click', function(evt) {
            evt.preventDefault();
            this.stop();
        }.bind(this));

        this.prevBtn.addEventListener('click', function(evt) {
            evt.preventDefault();
            this.prev();
        }.bind(this));

        this.nextBtn.addEventListener('click', function(evt) {
            evt.preventDefault();
            this.next();
        }.bind(this));

        this.repeatElem.addEventListener('click', function(evt) {
            evt.preventDefault();
            evt.target.classList.toggle('repeat-active');
            this.btnRepeat();
        }.bind(this));

        this.api.loadTrackList(function(res) {
            for (trackInfo of res['tracklist']) {
                this.tracklist.addTrackToList(new Track(trackInfo));  // `${trackinfo.track_uuid}.mp3`
            }
        }.bind(this));
    },
    setTrackList(tracklist) {
        this.tracklist = tracklist;
    },
    setPlayerSong(track) {
        this.currentTrack = track;
        this.audioEle.src = `/static/${track.trackUUid}.mp3`;
        this.audioEle.onloadedmetadata = this.onAudioLoaded.bind(this);
        this.audioEle.play();
    },
    play() {
        this.audioEle.play();
    },
    pause() {
        this.audioEle.pause();
    },
    stop() {
        this.audioEle.pause();
        this.audioEle.currentTime = 0;
    },
    next() {
        this.tracklist.advanceTrack();
        this.setCurrentTrackFromTrackList();
    },
    prev() {
        if (this.audioEle.currentTime > 3.6)
            return this.audioEle.currentTime = 0;
        
        this.tracklist.regressTrack();
        this.setCurrentTrackFromTrackList();
    },
    btnRepeat() {
        this.repeat = !this.repeat;
        console.log('repeat', this.repeat);
    },
    setCurrentTrackFromTrackList() {
        let track = this.tracklist.getCurrentTrack();
        console.log('playing song', track);

        this.loadID3Tags(track.trackUUid);
        this.setPlayerSong(track);
    },
    onAudioLoaded(evt) {
        let audioElem = evt.target;
        console.log('duration', audioElem.duration);
        this.tracklist.getCurrentTrack().setTrackDuration(audioElem.duration);
        this.progressBar(audioElem);
    },
    progressBar(audioELem) {
        let currentTime = audioELem.currentTime,
            totalTime = audioELem.duration;
        if (totalTime >= currentTime) {
            let percentProg = (currentTime / totalTime) * 100;
            this.progressBarDiv.style.width = `${percentProg.toFixed(2)}%`;
            setTimeout(() => {
                this.progressBar(audioELem);
            }, 100);
        }
    },
    onAudioEnded() {
        if (this.tracklist.isLastTrack()) {
            if (!this.repeat)
                return  console.log('End of session');
            this.tracklist.resetTrackListIndex();
        } else {
            this.tracklist.advanceTrack();
        }

        this.setCurrentTrackFromTrackList();
    },
    loadID3Tags(song) {
        this.jsmediatags.read(`http://localhost:8888/static/${song}.mp3`, {
            onSuccess: this.manageTags.bind(this),
            onError(error) {
                console.error(':(', error);
            }
        });
    },
    manageTags(tag) {
        if (!tag.hasOwnProperty('tags'))
            return;
        
        let tags = tag.tags;
        this.titleTrack.innerText = tags.title;
        this.titleAlbum.innerText = tags.album;

        if (!tags.hasOwnProperty('picture'))
            return this.albumImg.src = "/static/albumart.jpg";
        
        const { data, format } = tags.picture;
        let dataLen = data.length;

        if (dataLen == 0)
            return this.albumImg.src = "/static/albumart.jpg";
        
        let imgData = data.map((x) => String.fromCharCode(x)); 
        this.albumImg.src = `data:${format};base64,${window.btoa(imgData.join(''))}`;
    }
};


const FileBrowser = function(player, api) {
    this.overlayDiv = document.querySelector('.cnt-overlay');
    this.basePathBox = document.querySelector('.file-browser div.base-path');
    this.folderListBox = document.querySelector('.file-browser ul.folder-list');
    this.fileListBox = document.querySelector('.file-browser ul.file-list');
    this.baseDir = '/';
    this.api = api;
    this.browseHistory = [this.baseDir];
    this.historyIndex = 0;
    this.player = player;
    this.overlayDiv.addEventListener('click', this.closeFileBrowser.bind(this));
}

FileBrowser.prototype = {
    closeFileBrowser(evt) {
        if (evt.target != evt.currentTarget)
            return;
        clearElementInnerHTML(this.folderListBox);
        clearElementInnerHTML(this.fileListBox);
        this.overlayDiv.style.display = 'none';
    },
    folderSelector(evt) {
        let target = evt.target;
        let folderName = target.innerText.trim();
        console.log('foldername', folderName);
        if (folderName == '..') {
            let baseDirArray = this.baseDir.split('/');
            baseDirArray.splice((baseDirArray.length - 2), 1);
            this.baseDir = baseDirArray.join('/');
        } else {
            this.baseDir += folderName;
        }
        console.log('baseDir', this.baseDir);
        clearElementInnerHTML(this.folderListBox);
        clearElementInnerHTML(this.fileListBox);
        this.historyIndex++;
        this.browseHistory.push(this.baseDir);
        this.api.browseFiles(this.baseDir, this.fileBrowserCB.bind(this));
    },
    fileSelector(evt) {
        let target = evt.target;
        let fileName = target.innerText.trim();
        console.log('filename', fileName);
        this.api.addTrack(fileName, this.baseDir + fileName, function(res) {
            this.player.tracklist.addTrackToList(new Track(res['track']));
            this.player.max++;
        }.bind(this));
    },
    fileBrowserCB(res) {
        console.log(res);
        this.overlayDiv.style.display = 'block';
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
    }
};


(function(window, document) {
    let max = 5;
    const tracklist = new TrackList();
    for (let i = 0; i <= max; ++i) {
        tracklist.addTrackToList(new Track({
            track_name: `audio${i}.mp3`,
            track_uuid: `audio${i}`,
            track_original_path: '' 
        }));
    }

    const imgList = [];
    const api = new Api();
    const audioPlayer = new AudioPlayer(tracklist, api);
    api.loadBGImages(function(res) {
        imgList.push(...res['img_list']);
        audioPlayer.init();
        const fileBrowser = new FileBrowser(audioPlayer, api);
        document.querySelector('#file-browser-aaction button').addEventListener('click', fileBrowser.loadFileBrowser.bind(fileBrowser));
        console.log('imgList1', imgList);
        draw(0, true, 0);
    });


    const audioCtx = new AudioContext();
    const audioSourceNode = audioCtx.createMediaElementSource(audioPlayer.audioEle);

    //Create analyser node
    const analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 256;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    //Set up audio node network
    audioSourceNode.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);

    //Create 2D canvas
    const canvas = document.createElement("canvas");
    
    canvas.width = window.innerWidth - 36;
    canvas.height = window.innerHeight - 254;
    canvas.style.display = 'block';
    canvas.style.margin = 'auto';

    document.body.appendChild(canvas);
    
    const canvasCtx = canvas.getContext("2d");
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    let curImg = 'img1.jpg';
    let background = new Image();
    background.src = `http://localhost:8888/static/${curImg}`;

    // Make sure the image is loaded first otherwise nothing will draw.
    background.onload = function() {
        console.log('img loaded', background.width, background.height, canvas.width, canvas.height);
        let width, height, x, y = 0;
        //let coef = (canvas.width / background.width) * .8;
        let coef = (canvas.height / background.height) * 1.05;
        width =  background.width * coef;
        height = background.height * coef;
        x = parseInt((canvas.width / 2) - (width / 2));
        canvasCtx.globalAlpha = .1;
        canvasCtx.drawImage(background, x, y, width, height);
        canvasCtx.globalAlpha = 1;
    }

    function draw(c, d, i) {
        if (d)
            c += .75;
        else
            c -= .75;
        if (c >= 2328)
            d = false;
        else if (c == 0) {
            d = true;
            curImg = `imgb/${imgList[i]}`
            background.src = `http://localhost:8888/static/${curImg}`;
            ++i;
            if (i >= imgList.length)
                i = 0;
        }
        //Schedule next redraw
        requestAnimationFrame(function() {
            draw(c, d, i);
        });

        //Get spectrum data
        analyserNode.getFloatFrequencyData(dataArray);

        //Draw black background
        canvasCtx.fillStyle = "#181717";//"rgba(0,0,0,1)";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        let width, height, x, y = 0;
        // let coef = (canvas.width / background.width) * .8;
        let coef = (canvas.height / background.height) * (1.05 + (c / 3008));
        width =  background.width * coef;
        height = background.height * coef;
        let alphaVal = c;

        if (alphaVal >= 610)
            alphaVal = 610;
        else if (alphaVal <= 0)
            alphaVal = 0

        canvasCtx.globalAlpha = alphaVal / 1000;
        x = parseInt((canvas.width / 2) - (width / 2));
        canvasCtx.drawImage(background, x, y, width, height);
        canvasCtx.globalAlpha = 1;
        //Draw spectrum
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let posX = 0;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] + 140) * 2;
            //${Math.floor(255 - (barHeight + 60))} - ${parseInt(50 * Math.random())}
            canvasCtx.fillStyle = `rgb(${Math.floor(barHeight + 100)}, 50, ${parseInt(50)}, 0.66)`;
            canvasCtx.fillRect(
                posX,
                canvas.height - barHeight * 2,
                barWidth,
                barHeight * 2,
            );
            posX += barWidth + 1;
        }

        /*background.onload = function() {
            
        }*/
    }

    

})(this, document);
