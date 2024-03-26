// slideUp(litsItemUl, listItemsElem, maxHeight, 40);
const slideUp = (elem, parentElem, maxHeight, step, currentHeight, cb) => {
    let style = elem.style,
        parentStyle = parentElem.style;
    if (typeof currentHeight === 'undefined')
        currentHeight = 0;

    if (currentHeight < maxHeight) {
        currentHeight += step;
        parentStyle.maxHeight = style.maxHeight = (currentHeight).toString() + 'px' ;
        return requestAnimationFrame(slideUp.bind(undefined, elem, parentElem, maxHeight, step, currentHeight));
    }

    parentStyle.maxHeight = style.maxHeight = (maxHeight).toString() + 'px';
    if (typeof cb === 'function')
        return cb();
};


// slideDown(litsItemUl, listItemsElem, maxHeight, 40);
const slideDown = (elem, parentElem, targetHeight, step, currentHeight, cb) => {
    let style = elem.style,
        parentStyle = parentElem.style;
    currentHeight = typeof currentHeight  === 'number' ? currentHeight : targetHeight;

    if (currentHeight > 0) {
        currentHeight -= step;
        parentStyle.maxHeight = style.maxHeight = (currentHeight).toString() + 'px' ;
        return requestAnimationFrame(slideDown.bind(undefined, elem, parentElem, targetHeight, step, currentHeight, cb));
    }

    style.maxHeight = (targetHeight).toString() + 'px';
    parentStyle.maxHeight = '0px';

    if (typeof cb === 'function')
        return cb();
};


const whileMousePressedAndMove = (element, cb, doMouseout) => {    
    if (typeof doMouseout === 'undefined')
        doMouseout = false;

    let mouseID = -1, mouseMoveID = -1;
    
    const mousedown = (evt) => {
        mouseID = 1;
        cb.bind(cb, evt, true)();
    }

    const mousemove = (evt) => {
        if (mouseID != -1) {
            mouseMoveID = 2;
            cb.bind(cb, evt, true)();
        }
    };

    const mouseup = (evt) => {
        if (mouseID != -1) {
            mouseID = -1;
            cb.bind(cb, evt, false)();
        }
    }

    element.addEventListener("mousedown", mousedown);
    document.addEventListener('mousemove', mousemove);
    document.addEventListener("mouseup", mouseup);

    if (doMouseout)
        element.addEventListener('mouseout', mouseup);
};

const whileMousePressed = (element, cb, interval) => {
    if (typeof interval === 'undefined')
        interval = 100;
    
    let mouseID = -1;
    
    const mousedown = (evt) => {
        if (mouseID == -1)
            mouseID = setInterval(cb.bind(cb, evt), interval);
    }

    const mouseup = () => {
        if (mouseID != -1) {
            clearInterval(mouseID);
            mouseID = -1;
        }
    }

    element.addEventListener("mousedown", mousedown);
    element.addEventListener("mouseup", mouseup);
    element.addEventListener("mouseout", mouseup);
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
};


const Api = function() {
    this.url = 'http://localhost:8888/api';
    this.xhr = new XMLHttpRequest();
    this.csrftoken = readCookie('csrftoken');
};
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
        // xhr.setRequestHeader("X-CSRFToken", this.csrftoken);
        xhr.send();

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

const ID3Tags = function(tags) {
    this.jsmediatags = window.jsmediatags;
    this.tags = tags;
    this.artist = false;
    this.album = false;
    this.title = false;
    this.picture = [];

    this._manageTags(tags);
};
ID3Tags.prototype = {
    loadID3TagsFromTrack(track, cb) {
        this._loadID3Tags(track.trackUUid, cb);
    },
    getArtist() {
        return this.artist;
    },
    getTitle() {
        return this.title;
    },
    getAlbum() {
        return this.album;
    },
    getAlbumArt() {
        return this.picture;
    },
    getTags() {
        return this.tags;
    },
    _loadID3Tags(song, cb) {
        this.jsmediatags.read(`http://localhost:8888/static/${song}.mp3`, {
            onSuccess: (tags) => {
                this._manageTags.bind(this)(tags, cb);
            },
            onError(error) {
                console.error(':(', error);
            }
        });
    },
    _manageTags(tags, cb) {

        this.title = tags.title;
        if (typeof this.title === 'undefined' || this.title.length == 0)
            this.title = false;
        
        this.album = false;

        if (tags.album)
            this.album = tags.album;
        
        this.artist = tags.artist;
        
        if (typeof this.artist === 'undefined' || this.artist.length == 0)
            this.artist = false;
        if (!tags.hasOwnProperty('picture'))
            this.picture = false;
        else {
            const { data, format } = tags.picture;
            let dataLen = data.length;

            if (dataLen == 0)
                return this.picture = false;
            this.picture = [data, format];
        }

        if (typeof cb === 'function')
            cb(this);
    }
};

const Track = function(trackInfo, ID3) {
    this.trackName = trackInfo.track_name;
    this.trackUUid = trackInfo.track_uuid;
    this.trackOriginalPath = trackInfo.track_original_path;
    this.trackDuration = undefined;
    this.currentTime = 0;
    this.isPlaying = false;
    this._id3TagsInstance = new ID3Tags(ID3);
    this.id3Tags = ID3;
};
Track.prototype = {
    setTrackDuration(duration) {
        this.trackDuration = duration;
    },
    getTrackDuration(formated) {
        if (formated)
            return this.formatTrackDuration();
        return this.trackDuration;
    },
    setCurrentTime(val) {
        this.currentTime = val;
    },
    getCurrentTime(formated) {
        if (formated)
            return this.formatCurrentTime();
        return this.currentTime;
    },
    getTimeRemaining(formated) {
        let remainigTime = this.trackDuration - this.currentTime;
        if (formated)
            return this._formatTime(remainigTime);
        return remainigTime;
    },
    formatTrackDuration() {
        if (typeof this.trackDuration === 'undefined') {
            if (this.id3Tags === null) 
                return;
            this.duration = this.id3Tags.duration;
        }
        return this._formatTime(this.trackDuration);
    },
    formatCurrentTime() {
        return this._formatTime(this.currentTime);
    },
    getArtist() {
        return this._id3TagsInstance.getArtist();
    },
    getTitle() {
        return this._id3TagsInstance.getTitle();
    },
    getAlbum() {
        return this._id3TagsInstance.getAlbum();
    },
    getAlbumArt() {
        return this._id3TagsInstance.getAlbumArt();
    },
    getID3Tags() {
        return this.id3Tags;
    },
    setID3Tags(tags) {
        this.id3Tags = tags;
    },
    _formatTime(millisecTime) {
        let secs = '0', mins = '0';
        if (!isNaN(millisecTime)) {
            secs = parseInt(millisecTime % 60).toString(),
            mins = parseInt(millisecTime / 60).toString();
        }
        return `${mins.padStart(2, '0')}:${secs.padStart(2, '0')}`
    },
};

const OneEvent = function(callback) {
    this.callback = callback;
}
OneEvent.prototype = {
    trigger() {
        this.callback();
    }
}

const ListEvents = function() {
    this._eventsRegistered = [];
};
ListEvents.prototype = {
    onEventRegister(callback, eventKey) {
        this._eventsRegistered.push({'eventKey': eventKey,  'event': new OneEvent(callback)});
    },
    trigger(eventKey) {
        this._onEventTrigger(eventKey);
    },
    _onEventTrigger(eventKey) {
        const evts = this._eventsRegistered.filter(evt => evt.eventKey == eventKey);
        if (evts.length == 0)
            return;
        for (let i = 0; i < evts.length; ++i) {
            evts[i]['event'].trigger();
        }
    },
    _checkEventKey(eventKey) {
        const indx = this._eventsRegistered.findIndex(evt => evt.eventKey == eventKey);
        if (indx != -1) {
            console.error(`Event ${eventKey} already register`);
            throw `Event ${eventKey} already register`;
        }

    },
};

const TrackList = function(tracklist) {
    this.tracklist = tracklist || [];
    this.trackIndex = 0;
    this.tracksNumber = this.tracklist.length;
    this.trackListEvents = new ListEvents();

    if (this.tracklist.length > 0) {
        this.currentTrack = this.tracklist[this.trackIndex];
        this.trackIndexMax = this.tracksNumber - 1;
    } else {
        this.currentTrack = null;
        this.trackIndexMax = 0;
    }
}
TrackList.prototype = {
    getTrackList() {
        return this.tracklist;
    },
    loadTracksID3Tags(cb) {
        for (let i = 0; i < this.tracklist.length; ++i) {
            let track = this.tracklist[i];
            track.loadTrackID3Tags();
        }
        if (typeof cb === 'function')
            cb(this.tracklist);
    },
    setTrackList(tracklist) {
        this.tracklist = tracklist;
        this.trackIndex = 0;
        this.tracksNumber = tracklist.length;
        this.trackIndexMax = this.tracksNumber - 1;
        this.currentTrack = this.getCurrentTrack();
    },
    addTrackToList(track) {
        this.tracklist.push(track);
        ++this.tracksNumber;
        this.trackIndexMax = this.tracksNumber - 1;
    },
    getCurrentTrack() {
        if (this.currentTrack != null)
            return this.currentTrack;
        if (this.tracksNumber > 0)
            return this.tracklist[this.trackIndex];
        return null;
    },
    nextTrack() {
        this._advanceTrackIndex();
        this._setCurrentTrack();
        return this.getCurrentTrack(); 
    },
    previousTrack() {
        this._regressTrackIndex();
        this._setCurrentTrack();
        return this.getCurrentTrack();
    },
    isLastTrack() {
        return this.trackIndex == this.trackIndexMax;
    },
    resetTrackListIndex() {
        this.trackIndex = 0;
        this._setCurrentTrack();
    },
    setTrackIndex(indexVal, setCurTrack) {
        this.trackIndex = indexVal;
        if (setCurTrack === true)
            this._setCurrentTrack();
        this.trackListEvents.trigger('onIndexCahnge');
    },
    getTrackIndexByTrack(track) {
        return this.tracklist.findIndex(trk => trk.trackUUid == track.trackUUid);
    },
    onTrackIndexChange(cb) {
        this.trackListEvents.onEventRegister(cb, 'onIndexCahnge');
    },
    _setCurrentTrack() {
        this.currentTrack = this.tracklist[this.trackIndex];
    },
    _advanceTrackIndex() {
        if (this.trackIndex < this.trackIndexMax)
            ++this.trackIndex;
        else
            this.trackIndex = 0;
        console.log('INDEX ADVANCE', this.trackIndex, this.trackIndexMax);
    },
    _regressTrackIndex() {
        if (this.trackIndex > 0)
            --this.trackIndex;
        else
            this.trackIndex = this.trackIndexMax;
        console.log('INDEX REGRESS', this.trackIndex, this.trackIndexMax);
    },
};


const AudioPlayer = function(tracklist, api) {
    if (!tracklist) {
        console.error('No tracklist provided');
        throw 'No tracklist provided';
    }

    this.tracklist = tracklist;
    this.audioPlayerEvents = new ListEvents();

    this.volumeStep = .02;
    this.isPaused = true;
    //0 -> no repeat; 1 -> repeat all; 2 -> repeat one; 
    this.repeatMode = 1;
    this.repeatElem = document.querySelector('#repeat-button a');
    this.repeatElemGlyph = document.querySelector('#repeat-button a .fa-repeat');
    this.repeatOneElem = document.querySelector('#repeat-button a .repeat-one');

    this.disableProgress = false;

    this.playPauseBtn = document.querySelector('.player-action .fa-solid');

    this.albumImg = document.getElementById('album-art');
    this.titleTrack = document.getElementById('track-title');
    this.artistName = document.getElementById('artist-name');

    this.nameTrackElem = document.getElementById('name-track');
    this.nameAlbumElem = document.getElementById('name-album');
    this.timeTrackElem = document.getElementById('time-track');

    //0 -> static; 1 -> reverse; 2 -> forward; 
    this.displayTrackTimeMode = 1;

    this.mainVolumeBarElem = document.getElementById('main-volume-bar');
    this.volumeBarElem = document.getElementById('volume-bar');

    this.playBtn = document.getElementById('play-button');
    this.stopBtn = document.getElementById('stop-button');
    this.prevBtn = document.getElementById('prev-button');
    this.nextBtn = document.getElementById('next-button');
    this.volUpBtn = document.querySelector('span.vol-up');
    this.volDownBtn = document.querySelector('span.vol-down');

    this.volumeVal = document.querySelector('span.vol-val');

    this.progressBarDiv = document.getElementById('progress');
    this.subProgressBarDiv = document.getElementById('prog-bar');

    this.audioElem = new Audio();
    this.jsmediatags = window.jsmediatags;
    this.api = api;
};
AudioPlayer.prototype = {
    init() {
        this.audioElem.autoplay = false;
        this.audioElem.preload = "auto";
        this.audioElem.onloadedmetadata = this.onAudioLoaded.bind(this);
        this.audioElem.onended = this.onAudioEnded.bind(this);
        this.audioElem.ontimeupdate = (e) => {
            this.tracklist.getCurrentTrack().setCurrentTime(e.target.currentTime);
        };

        this.playBtn.addEventListener('click', function(evt) {
            evt.preventDefault();
            this.playPause();
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
            this.btnRepeat();
        }.bind(this));

        this.progressBarDiv.addEventListener('mouseenter', (evt) => {
            percentWidth = this._getPercentageWidthFromMousePosition(evt.clientX, this.progressBarDiv) * 100;
            this.progressBarDiv.style.background = `linear-gradient(90deg, rgba(255, 143, 143, 0.52) ${percentWidth}%, #181717 ${percentWidth}%)`;
        });

        this.progressBarDiv.addEventListener('mousemove', (evt) => {
            percentWidth = (this._getPercentageWidthFromMousePosition(evt.clientX, this.progressBarDiv) * 100).toFixed(2);
            this.progressBarDiv.style.background = `linear-gradient(90deg, rgba(255, 143, 143, 0.52) ${percentWidth}%, #181717 ${percentWidth}%)`;
        });

        this.progressBarDiv.addEventListener('mouseleave', () => {
            this.progressBarDiv.style.background = "#181717";
        });

        this.timeTrackElem.addEventListener('click', this.changeTrackTimeDisplayMode.bind(this));

        whileMousePressed(this.volUpBtn, this.increasVolume.bind(this), 84);
        whileMousePressed(this.volDownBtn, this.decreasVolume.bind(this), 84);

        whileMousePressedAndMove(this.progressBarDiv, this.seek.bind(this));
        whileMousePressedAndMove(this.subProgressBarDiv, this.seek.bind(this));
        whileMousePressedAndMove(this.mainVolumeBarElem, this.changeVolume.bind(this));
        whileMousePressedAndMove(this.volumeBarElem, this.changeVolume.bind(this));

        this.tracklist.onTrackIndexChange(() => {
            this.setCurrentTrackFromTrackList(true);
        });

        this._setRepeatBtnStyle();

        this.api.loadTrackList(function(res) {
            for (trackInfo of res['tracklist']) {
                let track = new Track(trackInfo['track'], trackInfo['ID3']),
                    id3Tags = trackInfo['ID3'];
                track.setTrackDuration(id3Tags.duration);
                this.tracklist.addTrackToList(track);
            }
            this.setCurrentTrackFromTrackList(false);
        }.bind(this));
    },
    seek(evt, mouseUp) {
        percentWidth = this._getPercentageWidthFromMousePosition(evt.clientX, this.progressBarDiv);
        
        this.disableProgress = mouseUp;

        if (!mouseUp)
            this.audioElem.currentTime = this.tracklist.getCurrentTrack().trackDuration * percentWidth;
        
        this._updateProgressBar(percentWidth  * 100, this.progressBar.bind(this, this.audioElem));
    },
    changeVolume(evt, mouseUp) {
        if (!mouseUp)
            this.mainVolumeBarElem.classList.remove('volume-action');
        else
            this.mainVolumeBarElem.classList.add('volume-action');

        this.setVolume(
            this._getPercentageWidthFromMousePosition(evt.clientX, this.mainVolumeBarElem)
        );
    },
    changeTrackTimeDisplayMode() {
        if (this.displayTrackTimeMode == 2)
            this.displayTrackTimeMode = 0;
        else
            ++this.displayTrackTimeMode;
    },
    setTrackList(tracklist) {
        this.tracklist = tracklist;
    },
    setPlayerSong(track, autoPlay) {
        this.currentTrack = track;
        this.currentTrack.isPlaying = autoPlay;
        this.audioElem.src = `/static/${track.trackUUid}.mp3`;
        this.audioElem.onloadedmetadata = this.onAudioLoaded.bind(this);
        this.audioPlayerEvents.trigger('playerSongChange');
        if (autoPlay === true)
            return this.play();
        return this.stop();
    },
    onPlayerSongChange(cb) {
        this.audioPlayerEvents.onEventRegister(() => {
            cb(this.currentTrack);
        }, 'playerSongChange');
    },
    playPause() {
        if (this.isPaused)
            this.play();
        else
            this.pause();

        return this.isPaused;
    },
    play() {
        this.isPaused = false;
        this.currentTrack.isPlaying = true;
        this.playPauseBtn.classList.replace('fa-play', 'fa-pause');
        this.audioElem.play();
    },
    pause() {
        this.isPaused = true;
        this.currentTrack.isPlaying = false;
        this.playPauseBtn.classList.replace('fa-pause', 'fa-play');
        this.audioElem.pause();
    },
    stop() {
        this.pause();
        this.audioElem.currentTime = 0;
    },
    next() {
        this.tracklist.nextTrack();
        this.setCurrentTrackFromTrackList(true);
        this.play();
    },
    prev() {
        if (this.audioElem.currentTime > 3.6) {
            this.audioElem.currentTime = 0;
        } else {
            this.tracklist.previousTrack();
            this.setCurrentTrackFromTrackList(true);
        }
        this.play();
    },
    btnRepeat() {
        if (this.repeatMode >= 2)
            this.repeatMode = 0;
        else
            ++this.repeatMode;
        this._setRepeatBtnStyle();
    },
    setVolume(volume) {
        if (volume > 1)
            volume = 1;
        else if (volume < 0)
            volume = 0;

        this.audioElem.volume = volume;
        this._updateVolumeBar(volume);
    },
    increasVolume() {
        let volume = this.audioElem.volume + this.volumeStep;
        this.setVolume(volume); 
    },
    decreasVolume() {
        let volume = this.audioElem.volume - this.volumeStep;
        this.setVolume(volume);
    },
    setCurrentTrackFromTrackList(autoPlay) {
        let track = this.tracklist.getCurrentTrack();
        console.log('playing song', track);

        this.loadID3Tags(track);
        this.setPlayerSong(track, autoPlay);
    },
    updateTrackTime() {
        const currentTrack = this.tracklist.getCurrentTrack();
        let formatedTrackTime;
        
        if (this.displayTrackTimeMode == 0)
            formatedTrackTime = currentTrack.getTrackDuration(true);
        else if (this.displayTrackTimeMode == 1)
            formatedTrackTime = currentTrack.getTimeRemaining(true);
        else
            formatedTrackTime = currentTrack.getCurrentTime(true);
        
        this.timeTrackElem.innerText = ` - [${formatedTrackTime}]`;
    },
    onAudioLoaded(evt) {
        let audioElem = evt.target;
        console.log('duration', audioElem.duration, 'volume', audioElem.volume);
        this.progressBar(audioElem);
    },
    progressBar(audioELem) {
        let currentTime = audioELem.currentTime,
            totalTime = audioELem.duration;
        this.updateTrackTime();
        if (totalTime >= currentTime && !this.disableProgress) {
            let percentProg = (currentTime / totalTime) * 100;
            this._updateProgressBar(percentProg.toFixed(2), this.progressBar.bind(this, audioELem));
        }
    },
    onAudioEnded() {
        let autoPlay;
        if (this.tracklist.isLastTrack()) {
            if (!this.repeatMode >= 1) {
                console.log('End of session');
                this.tracklist.nextTrack();
                autoPlay = false;
            }
            else {
                autoPlay = true;
                if (this.repeatMode == 1)
                    this.tracklist.resetTrackListIndex();
            }
        } else  {
            if (this.repeatMode != 2)
                this.tracklist.nextTrack();
             autoPlay = true;
        }

        this.setCurrentTrackFromTrackList(autoPlay);
    },
    loadID3Tags(track) {
        this._manageTags(track.getID3Tags());
    },
    _manageTags(tags) {
        let currentTrack = this.tracklist.getCurrentTrack();

        let title = tags.title;
        if (!title || typeof title === 'undefined' || title.length == 0)
            title = currentTrack.trackName;
        
        let album = ''
        if (tags.album)
            album = ` ~ ${tags.album}`
        
        let artist = tags.artist;
        
        if (!artist || typeof artist === 'undefined' || artist.length == 0)
            artist = 'N/A';
        console.log('trackResult', title, artist, album);
        let trackTime = currentTrack.getTrackDuration(true); 

        this.timeTrackElem.innerText = ` - [${trackTime}]`;
        this.nameAlbumElem.innerText = album;
        this.nameTrackElem.innerText = title;

        this.artistName.innerText = artist;

        if (!tags.hasOwnProperty('picture'))
            return this.albumImg.src = "/static/albumart.jpg";

        const { data, format } = tags.picture;
        let dataLen = data.length;

        if (dataLen == 0)
            return this.albumImg.src = "/static/albumart.jpg";
        
        // data.map((x) => String.fromCharCode(x)); 
        // this.albumImg.src = `data:${format};base64,${window.btoa(imgData.join(''))}`;
        let imgData = data;
        this.albumImg.src = `data:${format};base64,${imgData}`;
    },
    _setRepeatBtnStyle() {
        if (this.repeatMode == 0) {
            this.repeatOneElem.classList.remove('repeat-active');
            this.repeatElemGlyph.classList.remove('repeat-active');
        } else if (this.repeatMode == 1) {
            this.repeatOneElem.classList.remove('repeat-active');
            this.repeatElemGlyph.classList.add('repeat-active');
        } else if (this.repeatMode == 2) {
            this.repeatOneElem.classList.add('repeat-active');
            this.repeatElemGlyph.classList.add('repeat-active');
        }
    },
    _updateVolumeBar(volume) {
        toHundredVolume = volume * 100;
        this.volumeVal.innerText = Math.round(toHundredVolume).toString();

        requestAnimationFrame(() => {
            this.volumeBarElem.style.width = `${toHundredVolume}%`;
        });
    },
    _updateProgressBar(progress, cb) {
        requestAnimationFrame(() => {
            if (progress > 100)
                progress = 100;
            this.subProgressBarDiv.style.width = `${progress}%`;
            if (typeof cb === 'function')
                cb();
        });
    },
    _getPercentageWidthFromMousePosition(clientX, element, margin) {
        if (typeof margin === 'undefined')
            margin = 0;
        let widthPixel = (clientX - margin) - element.offsetLeft,
            totalWidth = element.offsetWidth;

        return widthPixel / totalWidth;
    }
};


const FileBrowser = function(player, api) {
    this.overlayDiv = document.querySelector('.cnt-overlay');
    this.fileExplorerBox = document.querySelector('.file-browser');
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
        this.fileExplorerBox.style.display = 'none';
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
            let track = new Track(trackInfo['track'], trackInfo['ID3']),
                id3Tags = trackInfo['ID3'];
            track.setTrackDuration(id3Tags.duration);
            this.player.tracklist.addTrackToList(track);
            this.player.max++;
        }.bind(this));
    },
    fileBrowserCB(res) {
        console.log("res", res);
        this.overlayDiv.style.display = 'block';
        this.fileExplorerBox.style.display = 'block';
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

const TrackListBrowser = function(tracklist, player) {
    this.overlayDiv = document.querySelector('.cnt-overlay');
    this.trackExplorerBox = document.querySelector('.track-browser');
    this.mainTableElem = document.querySelector('.tracklist-content');
    this.tableHeadElem = document.querySelector('.tracklist-content thead');
    this.tableBodyElem = document.querySelector('.tracklist-content tbody');
    this.tracklist = tracklist;
    this.player = player;
    this.loaded = false;
    this.player.onPlayerSongChange(this.setCurrentPlayingTrack.bind(this));
    this.itemsPerPage = 20;
    this.overlayDiv.addEventListener('click', this.closeTrackExplorer.bind(this));
};
TrackListBrowser.prototype = {
    closeTrackExplorer(evt) {
        if (evt.target != evt.currentTarget)
            return;
        this.overlayDiv.style.display = 'none';
        this.trackExplorerBox.style.display = 'none';
    },
    setTrackList(tracklist) {
        this.tracklist = tracklist;
    },
    load() {
        if (!this.loaded) {
            this.displayTracklList(0);
            this.loaded = true;
        }
    },
    displayTracklList(pageNumbre) {
        let tracklist = this.tracklist.getTrackList();

        for (x = 0; x < tracklist.length; ++x) {
            let track = tracklist[x];
            this._makeTracklistHTML(track, x, x % 2 == 0)
        }

        this.trackExplorerBox.style.display = 'block';
        this.overlayDiv.style.display = 'block';
    },
    playSongFromTracklist(trackIndex) {
        this.tracklist.setTrackIndex(trackIndex, true);
    },
    tracklistCallback(res, tracklist) {
        for (let trackInfo of res['tracklist'])
            tracklist.addTrackToList(new Track(trackInfo));

        this.setTrackList(tracklist.getTrackList());
        this.displayTracklList(0);
    },
    setCurrentPlayingTrack(track) {
        this._setCurrentrackStyle(track.trackUUid);
    },
    _setCurrentrackStyle(trackUUid) {
        const currentlyPlaying = document.querySelector('tr.currently-playing');
        if (currentlyPlaying)
            currentlyPlaying.classList.remove('currently-playing');
        for (const el of this.tableBodyElem.children) {
            console.log('el', el);
            if (el.dataset.trackId != trackUUid)
                continue;
            el.classList.add('currently-playing');
            break;
        };
    },
    _makeTracklistHTML(track, x, isEven) {
        let tr = document.createElement('tr');
        let currentTrack = this.tracklist.getCurrentTrack();
        let trackUUid = track.trackUUid;

        if (isEven)
            tr.classList.add('tr-blue');
        if (currentTrack.trackUUid == trackUUid)
            tr.classList.add('currently-playing');

        const trackIndex = this.tracklist.getTrackIndexByTrack(track);
        tr.dataset.trackIndex = trackIndex;
        tr.dataset.trackId = trackUUid;
        tr.addEventListener('dblclick', this.playSongFromTracklist.bind(this, trackIndex));
        let tdNumber = document.createElement('td'),
            tdTitle = document.createElement('td'),
            tdArtist = document.createElement('td'),
            tdAlbum = document.createElement('td'),
            tdDuration = document.createElement('td'),
            tdAction = document.createElement('td');
        tdNumber.innerHTML = x + 1;
        tdTitle.innerHTML = track.getTitle();
        tdArtist.innerHTML = track.getArtist();
        tdAlbum.innerHTML = track.getAlbum();
        tdDuration.innerHTML = track.formatTrackDuration();
        tdAction.innerHTML = `<span data-track-id="${trackUUid}" class="track-actions">&hellip;</span>`;
        tdNumber.classList.add('small-cell');
        // tdAction.classList.add('small-cell');
        tr.appendChild(tdNumber);
        tr.appendChild(tdTitle);
        tr.appendChild(tdArtist);
        tr.appendChild(tdAlbum);
        tr.appendChild(tdDuration);
        tr.appendChild(tdAction);

        this.tableBodyElem.appendChild(tr);
    },
    _unload() {
        if (this.loaded) {
            clearElementInnerHTML(this.tableBodyElem);
            this.loaded = false;
        }
    }
};

(function(window, document, undefined) {
    const tracklist = new TrackList();
    const imgList = [];
    const api = new Api();
    const audioPlayer = new AudioPlayer(tracklist, api);
    const trackListBrowser = new TrackListBrowser(tracklist, audioPlayer);

    api.loadBGImages(function(res) {
        imgList.push(...res['img_list']);
        audioPlayer.init();
        const fileBrowser = new FileBrowser(audioPlayer, api);
        
        document.querySelector('#file-browser-action button.open-file-browser').addEventListener('click', fileBrowser.loadFileBrowser.bind(fileBrowser));
        document.querySelector('#file-browser-action button.open-tracklist-browser').addEventListener('click', (evt) => {
            trackListBrowser.setTrackList(tracklist);
            trackListBrowser.load();
        });
        console.log('imgList1', imgList);
        draw(0, true, 0);
    });

    const audioCtx = new AudioContext();
    const audioSourceNode = audioCtx.createMediaElementSource(audioPlayer.audioElem);

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
    canvas.height = window.innerHeight - 204;
    canvas.style.display = 'block';
    canvas.style.margin = 'auto';
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth - 36;
        canvas.height = window.innerHeight - 204;
    });
    
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

    const draw = (c, d, i) => {
        if (d)
            c += 1;
        else
            c -= 1;
        if (c >= 2328)
            d = false;
        else if (c == 0) {
            d = true;
            curImg = encodeURI(`${imgList[i]}`);
            background.src = `http://localhost:8888/${curImg}`;
            ++i;
            if (i >= imgList.length)
                i = 0;
        }
        //Schedule next redraw
        requestAnimationFrame(() => {
            draw(c, d, i);
        });

        //Get spectrum data
        analyserNode.getFloatFrequencyData(dataArray);

        //Draw black background
        canvasCtx.fillStyle = "#181717";
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
        const barWidth = (canvas.width / bufferLength) * 1; //2.2;
        let posX = 0, posY = 0;
        for (let i = 0; i < bufferLength; i++) {
            let audioValue = dataArray[i];
            const barHeight = (audioValue + 140) * 2;
            posY = canvas.height - barHeight * 2 
            //${Math.floor(255 - (barHeight + 60))} - ${parseInt(50 * Math.random())}
            canvasCtx.fillStyle = `rgb(${Math.floor((barHeight / 1.4) + 140)}, 50, 50, 0.66)`;
            canvasCtx.fillRect(
                posX,
                posY,
                barWidth,
                barHeight * 2,
            );
            /*canvasCtx.font = "15px sans-serif";
            canvasCtx.textAlign = 'center';
            canvasCtx.fillStyle = `#f1f1f1`;
            canvasCtx.fillText(Math.abs(Math.round(audioValue).toString()), posX + 10, posY - 5, barWidth);*/
            posX += barWidth + 1;
        }
    };

    

})(this, document);
