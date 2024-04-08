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


const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


const getFormatedDate = () => {
    const DateTime = luxon.DateTime;
    const d = DateTime.now().setZone('Europe/Paris');
    return d.setLocale('es').toLocaleString(DateTime.TIME_WITH_SECONDS);
}

const fadeOut = (element, cb, speed, opacity) => {
    opacity = opacity || 1;  // initial opacity
    speed = speed || 0.1;
    var timer = setInterval(() => {
        if (opacity <= 0.1) {
            clearInterval(timer);
            element.style.display = 'none';
            if (typeof cb === 'function')
                cb(element);
        }
        element.style.opacity = opacity;
        element.style.filter = 'alpha(opacity=' + opacity * 100 + ")";
        opacity -= opacity * speed;
    }, 50);
}

const fadeIn = (element, cb, speed, opacity) => {
    opacity = opacity || 0.1;
    speed = speed || 0.1;
    element.style.display = 'block';
    const timerID = setInterval(() => {
        if (opacity >= 1) {
            clearInterval(timerID);
            if (typeof cb === 'function')
                cb(element);
        }
        
        requestAnimationFrame(() => {
            element.style.opacity = opacity
        });

        opacity += opacity * speed;
    }, 50);
}

const fadeInOut = (element, cb) => {
    if (element.style.display == 'block')
        fadeOut(element, cb);
    else
        fadeIn(element, cb);
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


const OneEvent = function(callback) {
    this.callback = callback;
}
OneEvent.prototype = {
    trigger(args) {
        this.callback(...args);
    }
};


const ListEvents = function() {
    this._eventsRegistered = [];
};
ListEvents.prototype = {
    onEventRegister(callback, eventKey) {
        this._eventsRegistered.push({'eventKey': eventKey,  'event': new OneEvent(callback)});
    },
    trigger(eventKey, ...args) {
        args = args || [];
        this._onEventTrigger(eventKey, args);
    },
    _onEventTrigger(eventKey, args) {
        const evts = this._eventsRegistered.filter(evt => evt.eventKey == eventKey);
        if (evts.length == 0)
            return;
        for (let i = 0; i < evts.length; ++i) {
            evts[i].event.trigger(args);
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


const Api = function() {
    this.url = 'http://jsradio.me:3600/api';
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
    editTrack(fieldType, fieldValue, trackUUid, callback) {
        let xhr = this.getXhrPost(`${this.url}/edit-track`);
        let data = JSON.stringify({
            field_type: fieldType,
            field_value: fieldValue,
            track_uuid: trackUUid
        });

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.setRequestHeader("X-CSRFToken", this.csrftoken);
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    deleteTrack(track_uuid, callback) {
        let xhr = this.getXhrPost(`${this.url}/delete-track`);
        let data = JSON.stringify({
            track_uuid: track_uuid
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
    },
    createPlaylist(playlistName, tracklist, callback) {
        let xhr = this.getXhrPost(`${this.url}/create-playlist`);
        let data = JSON.stringify({
            'playlist_name': playlistName,
            'traccklist': tracklist
        });

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    }
};

window.playerApi = new Api();

const ID3Tags = function(tags) {
    this.tags = tags;
    this.picture = [];

    this._manageTags(tags);
};
ID3Tags.prototype = {
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
    setArtist(artist) {
        this.tags.artist = artist;
        this._manageTags(this.tags);
    },
    setTitle(title) {
        this.tags.title = title;
        this._manageTags(this.tags);
    },
    setAlbum(album) {
        this.tags.album = album;
        this._manageTags(this.tags);
    },
    getDuration() {
        return this.duration;
    },
    getTags() {
        return this.tags;
    },
    _manageTags(tags) {
        this.title = tags.title;
        this.album = tags.album;
        this.artist = tags.artist;
        this.duration = tags.duration;

        if (tags.hasOwnProperty('picture')) {
            const { data, format } = tags.picture;
            let dataLen = data.length;

            if (dataLen == 0)
                return this.picture = false;
            this.picture = [data, format];
        }
    }
};

const Track = function(trackInfo) {
    this.trackName = trackInfo.track_name;
    this.trackUUid = trackInfo.track_uuid;
    this.trackOriginalPath = trackInfo.track_original_path;
    this.trackDuration = undefined;
    this.currentTime = 0;
    this.isPlaying = false;
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
        let remainigTime = this.trackDuration - this.getCurrentTime();
        if (formated)
            return this._formatTime(remainigTime);
        return remainigTime;
    },
    formatTrackDuration() {
        if (typeof this.trackDuration === 'undefined') {
            const id3Tags = this.getID3Tags();
            if (!id3Tags)
                return;
            this.duration = id3Tags.duration;
        }
        return this._formatTime(this.trackDuration);
    },
    formatCurrentTime() {
        return this._formatTime(this.getCurrentTime());
    },
    getArtist() {
        return this._id3TagsInstance.getArtist();
    },
    getTitle() {
        const title = this._id3TagsInstance.getTitle();
        if (typeof title === 'undefined' || title.length == '')
            return this.trackName;
        return title;
    },
    getAlbum() {
        return this._id3TagsInstance.getAlbum();
    },
    getAlbumArt() {
        return this._id3TagsInstance.getAlbumArt();
    },
    getID3Tags() {
        return this._id3TagsInstance.getTags();
    },
    setID3Tags(id3Tags) {
        this._id3TagsInstance = id3Tags;
    },
    setTag(tag, value) {
        console.log('setTag', tag, value);
        if (tag == 'title')
            this._id3TagsInstance.setTitle(value);
        else if (tag == 'artist')
            this._id3TagsInstance.setArtist(value);
        else if (tag == 'album')
            this._id3TagsInstance.setAlbum(value);
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


const TrackList = function(tracklist) {
    this.tracklist = tracklist || [];
    this.tracklistShuffle = [];
    this.trackIndex = 0;
    this.tracksNumber = this.tracklist.length;
    this.tracklistTotalDuration = 0;
    this.trackListEvents = new ListEvents();
    this.isShuffle = false;
    if (this.tracklist.length > 0) {
        this.currentTrack = this.tracklist[this.trackIndex];
        this.trackIndexMax = this.tracksNumber - 1;
    } else {
        this.currentTrack = null;
        this.trackIndexMax = 0;
    }
    this.addedToQueue = [];
}
TrackList.prototype = {
    getTrackList() {
        if (this.isShuffle)
            return this.tracklistShuffle;
        return this.tracklist;
    },
    setTrackList(tracklist) {
        this.tracklist = tracklist;
        this.trackIndex = 0;
        this.tracksNumber = tracklist.length;
        this.trackIndexMax = this.tracksNumber - 1;
        this.currentTrack = this.getCurrentTrack();
    },
    getTracksNumber() {
        return this.tracksNumber;
    },
    addTrackToList(track) {
        this.tracklist.push(track);
        if (this.isShuffle)
            this.tracklistShuffle.push(track);
        ++this.tracksNumber;
        this.trackIndexMax = this.tracksNumber - 1;
        this.addToTrackListTotalDuration(track.getTrackDuration());
    },
    addToQueue(track) {
        this.addedToQueue.push(track);
        this.trackListEvents.trigger('onAddedToQueue');
    },
    hasQueue() {
        return this.addedToQueue.length > 0;
    },
    getQueue() {
        return this.addedToQueue;
    },
    nextInQueue() {
        if (this.addedToQueue.length == 0) {
            console.error('No tracks left in queue');
            return this.getCurrentTrack();
        }
        this.currentTrack = this.addedToQueue.splice(0, 1)[0];
        return this.currentTrack;
    },
    onAddedToQueue(cb) {
        this.trackListEvents.onEventRegister(cb, 'onAddedToQueue');
    },
    getCurrentTrack() {
        if (this.currentTrack != null)
            return this.currentTrack;
        if (this.tracksNumber > 0)
            return this.getTrackList()[this.trackIndex];
        return null;
    },
    getTrackByUUID(trackUUid) {
        let tracks = this.tracklist.filter(trk => trk.trackUUid == trackUUid);
        if (tracks.length == 0)
            return;

        return tracks[0];
    },
    removeTrackFromTracklistByUUID(trackUUid) {
        const trackIndx = this.getTrackIndexByUUID(trackUUid);
        if (!trackIndx)
            return false;
        let track = this.getTrackByUUID(trackUUid);
        this.getTrackList().splice(trackIndx, 1);
        this.substractTracklistTotalDuration(track.getTrackDuration());
        track = null;
        --this.tracksNumber;
        this.trackIndexMax = this.tracksNumber - 1;
        return true;
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
    setTrackIndex(indexVal, doSetCurTrack) {
        this.trackIndex = indexVal;
        if (doSetCurTrack === true)
            this._setCurrentTrack();
        this.trackListEvents.trigger('onIndexChange');
    },
    getTrackIndexByTrack(track) {
        return this.getTrackIndexByUUID(track.trackUUid);
    },
    getTrackIndexByUUID(trackUUid) {
        return this.getTrackList().findIndex(trk => trk.trackUUid == trackUUid);
    },
    onTrackIndexChange(cb) {
        this.trackListEvents.onEventRegister(cb, 'onIndexChange');
    },
    isShuffleOn() {
        return this.isShuffle;
    },
    shuffle(conserveCurrentTrack) {
        let tracklist;
        if (this.isShuffle) {
            this.tracklistShuffle = [];
            this.isShuffle = false;
            this.setTrackIndex(this.getTrackIndexByTrack(this.getCurrentTrack()));
            tracklist = this.tracklist;
        } else {
            let trackIndex;
            if (conserveCurrentTrack === true)
                trackIndex = this.trackIndex;
            this.shuffleTracklist(trackIndex);
            tracklist = this.tracklistShuffle;
        }
        this.trackListEvents.trigger('onShuffleTracklist', tracklist);
    },
    shuffleTracklist(trackIndex) {
        this.tracklistShuffle = this._shuffle([...this.tracklist], trackIndex);
        this.isShuffle = true;
        this.setTrackIndex(0, true);
    },
    onShuffleTracklist() {
        this.trackListEvents.onEventRegister(cb, 'onShuffleTracklist');
    },
    setTrackListTotalDuration(duration) {
        this.tracklistTotalDuration = duration;
    },
    addToTrackListTotalDuration(duration) {
        this.tracklistTotalDuration += duration;
    },
    substractTracklistTotalDuration(duration) {
        this.tracklistTotalDuration -= duration;
    },
    getTrackListTotalDuration(formated) {
        if (formated) 
            return this._formatTime(this.tracklistTotalDuration);
        return this.tracklistTotalDuration;
    },
    _setCurrentTrack() {
        this.currentTrack = this.getTrackList()[this.trackIndex];
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
    _shuffle(tracklist, trackIndex) {
        let track;
        if (!isNaN(trackIndex))
            track = tracklist.splice(trackIndex, 1)[0];
        for (let i = tracklist.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [tracklist[i], tracklist[j]] = [tracklist[j], tracklist[i]];
        }
        if (track)
            tracklist.splice(0, 0, track);
        return tracklist;
    },
    _formatTime(secTime) {
        let secs = '0', mins = '0', houres = '0';
        if (!isNaN(secTime)) {
            houres = parseInt(secTime / 3600).toString();
            secs = parseInt(secTime % 60).toString();
            mins = parseInt((secTime % 3600) / 60).toString();
        }
        return `${houres.padStart(2, '0')}:${mins.padStart(2, '0')}:${secs.padStart(2, '0')}`
    }
};

const Playlist = function(tracklist) {
    this.tracklist = tracklist;
    this.api = window.playerApi;
};
Playlist.prototype = {
    setPlaylistName(name) {
        this.playlistName = name;
    },
    getPlaylistName() {
        return this.playlistName;
    },
    setPlaylistUUID(uuid4) {
        if (typeof uuid4 === 'undefined')
            uuid4 = crypto.randomUUID();
        this.playlistUUID = uuid4;
    },
    setTrackList(tracklist) {
        this.tracklist = tracklist;
    },
    getTrackList() {
        return this.tracklist;
    },
    addTrack(track) {
        this.tracklist.addTrackToList(track);
    },
    removeTrackFromList(track) {
        this.tracklist.removeTrackFromTracklistByUUID(track.trackUUid);
    },
    next() {
        return this.tracklist.nextTrack();
    },
    previous() {
        return this.tracklist.previousTrack();
    },
    savePlaylist() {
        this.api.createPLaylist(this.playlistName, this.tracklist.getTrackList(), (res) => {
            console.log('savePlaylist', res);
        });
    }
};


const PlaylistCreationTool = function() {
};
PlaylistCreationTool.prototype = {
    createPlaylist(tracklist) {
        this.playlist = new Playlist(tracklist)
    },
    getPlaylist() {
        return this.playlist;
    },
    displayPLaylistCreationStudio(evt) {
        evt.preventDefault();
        console.log('coming soon..');
    }
};


const AudioPlayer = function(tracklist) {
    if (!tracklist) {
        console.error('No tracklist provided');
        throw 'No tracklist provided';
    }

    this.tracklist = tracklist;
    this.audioPlayerEvents = new ListEvents();

    this.volumeStep = 0.02;
    this.seekStep = 5;
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
    this.shuffleBtn = document.getElementById('shuffle-button');
    this.volUpBtn = document.querySelector('span.vol-up');
    this.volDownBtn = document.querySelector('span.vol-down');

    this.volumeVal = document.querySelector('span.vol-val');

    this.progressBarDiv = document.getElementById('progress');
    this.subProgressBarDiv = document.getElementById('prog-bar');

    this.audioElem = new Audio();
    this.jsmediatags = window.jsmediatags;
};
AudioPlayer.prototype = {
    init() {
        this._setUpPlayer();

        this._setUpPlayerControls();

        this.shuffleBtn.addEventListener('click', this.shuffle.bind(this));

        this.progressBarDiv.addEventListener('mouseenter', (evt) => {
            percentWidth = this._getPercentageWidthFromMousePosition(evt.clientX, this.progressBarDiv) * 100;
            this.progressBarDiv.style.background = `linear-gradient(90deg, rgba(3, 207, 252, 0.6) ${percentWidth}%, #181717 ${percentWidth}%)`;
        });

        this.progressBarDiv.addEventListener('mousemove', (evt) => {//3, 207, 252 - 255, 143, 143
            percentWidth = (this._getPercentageWidthFromMousePosition(evt.clientX, this.progressBarDiv) * 100).toFixed(2);
            this.progressBarDiv.style.background = `linear-gradient(90deg, rgba(3, 207, 252, 0.6) ${percentWidth}%, #181717 ${percentWidth}%)`;
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
    },
    seek(evt, mouseUp) {
        percentWidth = this._getPercentageWidthFromMousePosition(evt.clientX, this.progressBarDiv);
        this.disableProgress = mouseUp;

        if (!mouseUp)
            this.setCurrentTime(this.tracklist.getCurrentTrack().trackDuration * percentWidth);
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
    getTrackList() {
        return this.tracklist;
    },
    setPlayerSong(track, autoPlay) {
        this.currentTrack = track;
        this.currentTrack.isPlaying = autoPlay;
        this.audioElem.src = `/static/${track.trackUUid}.mp3`;
        this.audioElem.onloadedmetadata = this.audioLoaded.bind(this);
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
        this.setCurrentTime(0);
    },
    next() {
        if (!this.tracklist.hasQueue())
            this.tracklist.nextTrack();
        this.setCurrentTrackFromTrackList(true);
        this.play();
    },
    prev() {
        if (this.getCurrentTime() > 3.6) {
            this.setCurrentTime(0);
        } else {
            if (!this.tracklist.hasQueue())
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
    setCurrentTime(timeInSec) {
        if (timeInSec < 0)
            timeInSec = 0;
        else if (timeInSec > this.currentTrack.getTrackDuration())
            timeInSec = this.currentTrack.getTrackDuration();

        this.audioElem.currentTime = timeInSec;
    },
    getCurrentTime() {
        return this.audioElem.currentTime;
    },
    setVolume(volume) {
        if (volume > 1)
            volume = 1;
        else if (volume < 0)
            volume = 0;

        this.audioElem.volume = volume;
        this._updateVolumeBar(volume);
        this.audioPlayerEvents.trigger('onVolumeChange', volume);
    },
    onVolumeChange(cb) {
        this.audioPlayerEvents.onEventRegister(cb, 'onVolumeChange');
    },
    mute() {
        this.audioElem.muted = !this.audioElem.muted
    },
    isMuted() {
        return this.audioElem.muted;
    },
    shuffle(evt) {
        evt.preventDefault();
        this.tracklist.shuffle(!this.isPaused);
        if (this.isPaused)
            this.setCurrentTrackFromTrackList(false);
        this._setShuffleBtnStyle(this.tracklist.isShuffle);
        this.audioPlayerEvents.trigger('onShuffle', this.tracklist);
    },
    onShuffle(cb) {
        this.audioPlayerEvents.onEventRegister(cb, 'onShuffle');
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
        let track;
        if (this.tracklist.hasQueue())
            track = this.tracklist.nextInQueue();
        else
            track = this.tracklist.getCurrentTrack();
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
    audioLoaded(evt) {
        let audioElem = evt.target;
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
    audioEnded() {
        let autoPlay, hasQueue = this.tracklist.hasQueue();
        if (this.tracklist.isLastTrack() && !hasQueue) {
            if (!this.repeatMode >= 1) {
                console.log('End of session');
                this.tracklist.nextTrack();
                autoPlay = false;
            }
            else {
                autoPlay = true;
                if (this.repeatMode == 1) {
                    if (!this.tracklist.isShuffleOn())
                        this.tracklist.resetTrackListIndex();
                    else {
                        this.tracklist.shuffleTracklist();
                        this.audioPlayerEvents.trigger('onShuffle');
                    }
                }
            }
        } else  {
            if (this.repeatMode != 2 && !hasQueue)
                this.tracklist.nextTrack();
             autoPlay = true;
        }

        this.setCurrentTrackFromTrackList(autoPlay);
    },
    loadID3Tags(track) {
        this._manageTags(track.getID3Tags());
    },
    _setUpPlayer() {
        this.audioElem.autoplay = false;
        this.audioElem.preload = "auto";
        this.audioElem.onloadedmetadata = this.audioLoaded.bind(this);
        this.audioElem.onended = this.audioEnded.bind(this);
        this.audioElem.ontimeupdate = (evt) => {
            this.tracklist.getCurrentTrack().setCurrentTime(evt.target.currentTime);
        };
    },
    _setUpPlayerControls() {
        this.playBtn.addEventListener('click', (evt) => {
            evt.preventDefault();
            this.playPause();
        });

        this.stopBtn.addEventListener('click', (evt) => {
            evt.preventDefault();
            this.stop();
        });

        this.prevBtn.addEventListener('click', (evt) => {
            evt.preventDefault();
            this.prev();
        });

        this.nextBtn.addEventListener('click', (evt) => {
            evt.preventDefault();
            this.next();
        });

        this.repeatElem.addEventListener('click', (evt) => {
            evt.preventDefault();
            this.btnRepeat();
        });
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
    _setShuffleBtnStyle(isShuffle) {
        if (!isShuffle)
            return this.shuffleBtn.classList.remove('repeat-active');
        return this.shuffleBtn.classList.add('repeat-active');
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
        
        let widthPixel = (clientX - margin) - (element.offsetLeft + element.offsetParent.offsetLeft),
            totalWidth = element.offsetWidth;
        
        return widthPixel / totalWidth;
    },
};


const FileBrowser = function(player) {
    this.overlayDiv = document.querySelector('.cnt-overlay');
    this.baseDir = '/';
    this.api = window.playerApi;
    this.browseHistory = [this.baseDir];
    this.historyIndex = 0;
    this.player = player;
    this.overlayDiv.addEventListener('click', this.closeFileBrowser.bind(this));
    this.folderBrowserEvent = new ListEvents();
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
        let fileName = target.innerText.trim();
        let tracklist = this.player.tracklist;
        console.log('filename', fileName);
        this.api.addTrack(fileName, this.baseDir + fileName, function(res) {
            let track = new Track(res['track']),
                id3Tags = new ID3Tags(res['ID3']);
            track.setID3Tags(id3Tags);
            track.setTrackDuration(id3Tags.getDuration());
            tracklist.addTrackToList(track);
            this.folderBrowserEvent.trigger('onSongAdded', track, this.player.getTrackList().getTracksNumber() - 1);
        }.bind(this));
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
    onSongAdded(cb) {
        this.folderBrowserEvent.onEventRegister((track, idx) => {
            cb(track, idx);
        }, 'onSongAdded');
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


const TrackListBrowser = function(tracklist, player) {
    this.overlayDiv = document.querySelector('.cnt-overlay');
    this.tracklist = tracklist;
    this.player = player;
    this.loaded = false;
    this.trackSearch = new TrackSearch(this.tracklist, this);
    this.trackSearch.onSearchResult(this.searchTrack.bind(this));
    this.trackSearch.onSearchVisibilityChange(this.restoreTracklistFromSearch.bind(this));
    this.player.onPlayerSongChange(this.setCurrentPlayingTrack.bind(this));
    this.player.onShuffle(this.reload.bind(this, true, true));
    this.itemsPerPage = 20;
    this.eventTraclistBrowser = new ListEvents();
    this.overlayDiv.addEventListener('click', (evt) => {
        if (evt.target != evt.currentTarget)
            return;
        if (this.isOpen)
            this.closeTrackExplorer();
    });
};
TrackListBrowser.prototype = {
    closeTrackExplorer(keep, unload) {
        if (unload)
            this.unload();
        if (keep !== true) {
            this._closeTrackExplorer();
        }
        this.eventTraclistBrowser.trigger('onCloseTracklistBrowser');
    },
    onCloseTracklistBrowser(cb) {
        this.eventTraclistBrowser.onEventRegister(cb, 'onCloseTracklistBrowser');
    },
    openTracklistExplorer(kept) {
        this.load();
        if (kept !== true) {
            this._displayTrackExplorer();
        }
    },
    setTrackList(tracklist) {
        this.loaded = false;
        this.tracklist = tracklist;
    },
    addTrackToList(track, idx) {
        this._makeTracklistHTML(track, idx, idx % 2 == 0);
    },
    load() {
        if (!this.loaded) {
            this.loaded = this.displayTracklList(0);
        }
    },
    unload() {
        this.loaded = false;
    },
    reload(keep, unload) {
        this.closeTrackExplorer(keep, unload);
        this.openTracklistExplorer(keep);
    },
    toggleLoad(keep) {
        if (this.loaded)
            this.closeTrackExplorer(keep);
        else
            this.openTracklistExplorer(keep);
    },
    setElementBoxes(trackExplorerBox, mainTableElem, tableHeadElem, tableBodyElem) {
        this.trackExplorerBox = trackExplorerBox;
        this.mainTableElem = mainTableElem;
        this.tableHeadElem = tableHeadElem;
        this.tableBodyElem = tableBodyElem;
        this.trackSearch.init();
    },
    displayTracklList(pageNumbre) {
        let tracklist = this.tracklist.getTrackList();
        clearElementInnerHTML(this.tableBodyElem);
        console.log('tracklist', tracklist);
        if (tracklist.length == 0)
            return false
        for (x = 0; x < tracklist.length; ++x) {
            let track = tracklist[x];
            this._makeTracklistHTML(track, x, x % 2 == 0)
        }

        return true
    },
    playSongFromTracklist(trackIndex) {
        this.tracklist.setTrackIndex(trackIndex, true);
    },
    setCurrentPlayingTrack(track) {
        if (this.loaded)
            this._setCurrentrackStyle(track.trackUUid);
    },
    searchTrack(tracks) {
        if (tracks.length == 0)
            return;

        clearElementInnerHTML(this.tableBodyElem);
        for (x = 0; x < tracks.length; ++x) {
            let track = tracks[x];
            this._makeTracklistHTML(track, x, x % 2 == 0);
        }
        this.loaded = true;
    },
    restoreTracklistFromSearch(visible) {
        if (!visible) {
            this.reload(true, true);
        }
    },
    _displayTrackExplorer() {
        this.isOpen = true;
        this.trackExplorerBox.style.display = 'block';
        this.overlayDiv.style.display = 'block';
    },
    _closeTrackExplorer() {
        this.isOpen = false;
        this.overlayDiv.style.display = 'none';
        this.trackExplorerBox.style.display = 'none';
    },
    _setCurrentrackStyle(trackUUid) {
        const currentlyPlaying = document.querySelector('tr.currently-playing');
        if (currentlyPlaying)
            currentlyPlaying.classList.remove('currently-playing');
        const trELements = this.tableBodyElem.children;
        for (let i = 0; i < trELements.length; ++i) {
            let tr = trELements[i];
            if (tr.dataset.trackId != trackUUid)
                continue;
            tr.classList.add('currently-playing');
            break;
        };
    },
    _displayTracklistInfo() {
        const nbTracksElem = document.querySelector('.tracklist-info-cnt .tracklist-info-nb .nb-tracks');
        const totalDurationElem = document.querySelector('.tracklist-info-cnt .tracklist-info-duration .duration-tracks');
        nbTracksElem.innerText = this.tracklist.getTracksNumber();
        totalDurationElem.innerText = this.tracklist.getTrackListTotalDuration(true);
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
        // tr.addEventListener('dblclick', this.playSongFromTracklist.bind(this, trackIndex));
        let tdNumber = document.createElement('td'),
            tdTitle = document.createElement('td'),
            tdArtist = document.createElement('td'),
            tdAlbum = document.createElement('td'),
            tdDuration = document.createElement('td'),
            tdTrackPlay = document.createElement('td'),            
            tdAction = document.createElement('td'),
            spanAction = document.createElement('span'),
            liEllipsis = document.createElement('li'),
            liPlay = document.createElement('li');

        spanAction.dataset.trackId = trackUUid;
        spanAction.classList.add('track-actions');
        liEllipsis.className = 'fa-solid fa-ellipsis';
        tdTitle.dataset.fieldType = 'title';
        tdArtist.dataset.fieldType = 'artist';
        tdAlbum.dataset.fieldType = 'album';
        
        tdTrackPlay.className = 'track-play';
        tdTrackPlay.dataset.trackId = trackUUid;
        tdTrackPlay.addEventListener('click', this.playSongFromTracklist.bind(this, trackIndex));
        liPlay.className = "fa-solid fa-play";
        tdTrackPlay.appendChild(liPlay);
        tdTitle.addEventListener('click', TrackEditor.onclickCell.bind(TrackEditor));
        tdArtist.addEventListener('click', TrackEditor.onclickCell.bind(TrackEditor));
        tdAlbum.addEventListener('click', TrackEditor.onclickCell.bind(TrackEditor));
        tdNumber.innerHTML = x + 1;
        tdTitle.innerHTML = track.getTitle();
        tdArtist.innerHTML = track.getArtist();
        tdAlbum.innerHTML = track.getAlbum();
        tdDuration.innerHTML = track.formatTrackDuration();
        
        tdNumber.classList.add('small-cell');
        tdDuration.classList.add('small-cell');

        liEllipsis.addEventListener('click', this.showActionMenu.bind(this));
        spanAction.appendChild(liEllipsis);
        tdAction.appendChild(spanAction);

        tr.append(tdNumber, tdTitle, tdArtist, tdAlbum, tdDuration, tdAction, tdTrackPlay);
        
        this.tableBodyElem.appendChild(tr);

        this._displayTracklistInfo();
    },
    showActionMenu(evt) {
        const target = evt.target;
        const targetChildren = target.parentNode.getElementsByClassName('action-menu-cnt');

        if (targetChildren.length > 0 ) {
            return targetChildren[0].style.display = 'block';
        }

        const trackUUid = target.parentNode.dataset.trackId;
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
    addToQueueAction(divElem, trackUUid) {
        this.tracklist.addToQueue(this.tracklist.getTrackByUUID(trackUUid));
        divElem.style.display = 'none';
    },
    deleteTrackAction(liDelete, divElem, trackUUid) {
        const api = window.playerApi;
        api.deleteTrack(trackUUid, (res) => {
            if (res.success) {
                this.tracklist.removeTrackFromTracklistByUUID(trackUUid);
                this.reload(true, true);
            } else
                alert('Error deleting file');
        });
    },
    addToFavoriteAction(liFavorite, divElem, trackUUid) {
        console.log('not implemented :|', trackUUid);
    },
    hideActionMenu(divElem) {
        divElem.style.display = 'none';
    }
};


const TrackSearch = function(tracklist, tracklistBrowser) {
    this.tracklist = tracklist;
    this.searchEvents = new ListEvents();
    this.term = '';
    this.tracklistBrowser = tracklistBrowser;
}
TrackSearch.prototype = {
    init() {
        this.magGlassElem = document.querySelector('.tracklist-head .tracklist-search .img-cnt');
        this.inputSearchElem = document.querySelector('.tracklist-head .tracklist-search .input-cnt');
        this.searchInput = document.querySelector('.tracklist-head .tracklist-search .input-cnt .search-input');
        this.magGlassElem.addEventListener('click', this._toggleInputSearchVisibility.bind(this));
        this.inputSearchElem.addEventListener('keyup', this.search.bind(this));
        this.tracklistBrowser.onCloseTracklistBrowser(this._unsetExclusivity.bind(this));
    },
    setTrackList(trackList) {
        this.tracklist = trackList;
    },
    search(evt) {
        this.result = this._searchTrack(evt.target.value);
        this.searchEvents.trigger('onSearchResult', this.result);
    },
    onSearchResult(cb) {
        this.searchEvents.onEventRegister(cb, 'onSearchResult', this.result);
    },
    onSearchVisibilityChange(cb) {
        this.searchEvents.onEventRegister(() => {
            cb(this._isSearchVisible());
        }, 'onSearchVisibilityChange');
    },
    _isSearchVisible() {
        return this.inputSearchElem.style.visibility == 'visible';
    },
    _toggleInputSearchVisibility() {
        if (!this._isSearchVisible()) {
            this._setExclusivity();
            this.inputSearchElem.style.visibility = 'visible';
            this.searchInput.focus();
        } else {
            this._unsetExclusivity();
            this.inputSearchElem.style.visibility = 'hidden';
            this.term = '';
            this.searchInput.value = '';
        }
        this.searchEvents.trigger('onSearchVisibilityChange');
    },
    _setExclusivity() {
        console.log('Setting exclusivity');
        window.KeyCotrols.setExlcusivityCallerKeyUpV2(this);
        window.KeyCotrols.setExlcusivityCallerKeyDownV2(this);
    },
    _unsetExclusivity() {
        console.log('Unsetting exclusivity');
        window.KeyCotrols.unsetExlcusivityCallerKeyUpV2(this);
        window.KeyCotrols.unsetExlcusivityCallerKeyDownV2(this);
    },
    _searchTrack(term) {
        let termLower = term.toLowerCase();
        const tracklist = this.tracklist.getTrackList();
        return tracklist.filter(trk => trk.trackUUid.includes(termLower) || 
            trk.trackName.toLowerCase().includes(termLower) || 
            (trk.getArtist() && trk.getArtist().toLowerCase().includes(termLower)) ||
            (trk.getTitle() && trk.getTitle().toLowerCase().includes(termLower)) ||
            (trk.getAlbum() && trk.getAlbum().toLowerCase().includes(termLower)))
    },
}


const TrackEditor = {
    tracklist: '',
    onclickCell(evt) {
        this._setExclusivity();
        const target = evt.target;
        const inputField = document.createElement('input');
        const hiddenInputField = document.createElement('input');
        const trackUUid = target.parentNode.dataset.trackId;

        hiddenInputField.type = 'hidden';

        inputField.className = 'track-edit';
        inputField.value = target.innerText;
        hiddenInputField.value = target.innerText;
        inputField.dataset.trackId = trackUUid;
        this.cachedValue = target.innerText;
        this.fieldType = inputField.dataset.fieldType;
        inputField.addEventListener('blur', this.onValidate.bind(this));
        window.KeyCotrols.registerKeyDownAction('Enter', this.onValidate.bind(this), this);

        target.innerHTML = '';
        target.append(inputField, hiddenInputField);
        inputField.focus();
    },
    onValidate({target}) {
        this._unsetExclusivity();
        const targetValue = target.value;
        const targetSibling = target.nextSibling;
        const targetParent = target.parentNode;
        if (targetSibling != null && targetValue != targetSibling.value) {
            const trackUUid = targetParent.parentNode.dataset.trackId;
            const fieldType = targetParent.dataset.fieldType;
            window.playerApi.editTrack(fieldType, targetValue, trackUUid, (res) => {
                if (res.success) {
                    targetParent.innerHTML = targetValue;
                    const track = this.tracklist.getTrackByUUID(trackUUid);
                    track.setTag(fieldType, targetValue);
                } else {
                    targetParent.innerHTML = targetSibling.value;
                }
            });
        } else {
            targetParent.innerHTML = targetValue;
        }
    },
    _setExclusivity() {
        window.KeyCotrols.setExlcusivityCallerKeyUpV2(this);
        window.KeyCotrols.setExlcusivityCallerKeyDownV2(this);
    },
    _unsetExclusivity() {
        window.KeyCotrols.unsetExlcusivityCallerKeyUpV2();
        window.KeyCotrols.unsetExlcusivityCallerKeyDownV2();
    },
};


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


const KeyValues = function() {
    this.SPACE = ' ';
    this.PLUS = '+';
    this.MINUS = '-';
    this.T = 't';
    this.CAP_P = 'P';
    this.ArrowRight = 'ArrowRight';
    this.ArrowLeft = 'ArrowLeft';
}


const KeyCotrols = function(keyvalues) {
    if (typeof keyvalues === 'undefined') {
        const e = new Error('KeyValues instance is required!');
        console.error(e);
        throw e;
    }

    this.playPauseKey = keyvalues.SPACE;
    this.minusVolKey = keyvalues.MINUS;
    this.plusVolKey = keyvalues.PLUS;
    this.nextTrackKey = keyvalues.ArrowRight;
    this.prevTrackKey = keyvalues.ArrowLeft;
    this.enabled = true;
    this._keyDownActions = {};
    this._keyUpActions = {};
    this._exclusivityCallerKeyUp = [];
    this._exclusivityCallerKeyDown = [];
    this._exclusivityCallerKeyUpV2 = [];
    this._exclusivityCallerKeyDownV2 = [];
    this._setUpBuiltinActions();
    this._bindEvents();
};
KeyCotrols.prototype = {
    enable() {
        this.enabled = true;
    },
    disable() {
        this.enabled = false;
    },
    isEnabled() {
        return this.enabled;
    },
    setPlayer(player) {
        if (typeof player === 'undefined') {
            const e = new Error('A player is required!');
            console.error(e);
            throw e;
        }
        this.player = player;
    },
    setExlcusivityCallerKeyUp(key, caller) {
        const previousCaller = this._exclusivityCallerKeyUp.filter(obj => obj.key == key);
        if (previousCaller.length != 0)
            return;
        this._exclusivityCallerKeyUp.push({key, caller});
    },
    unsetExlcusivityCallerKeyUp(key, caller) {
        const previousCallerIdx = this._exclusivityCallerKeyUp.findIndex(obj => obj.key == key && obj.caller == caller);
        if (typeof previousCallerIdx === 'undefined')
            return;
        this._exclusivityCallerKeyUp.splice(previousCallerIdx, 1);
    },
    setExlcusivityCallerKeyDown(key, caller) {
        const previousCaller = this._exclusivityCallerKeyDown.filter(obj => obj.key == key);
        if (previousCaller.length != 0)
            return;
        this._exclusivityCallerKeyDown.push({key, caller});
    },
    unsetExlcusivityCallerKeyDown(key, caller) {
        const previousCallerIdx = this._exclusivityCallerKeyDown.findIndex(obj => obj.key == key && obj.caller == caller);
        if (typeof previousCallerIdx === 'undefined')
            return;
        this._exclusivityCallerKeyDown.splice(previousCallerIdx, 1);
    },
    setExlcusivityCallerKeyUpV2(caller) {
        this._exclusivityCallerKeyUpV2.push(caller);
    },
    unsetExlcusivityCallerKeyUpV2(caller) {
        const previousCallerIdx = this._exclusivityCallerKeyUpV2.findIndex(obj => obj == caller);
        if (typeof previousCallerIdx === 'undefined')
            return;
        this._exclusivityCallerKeyUpV2.splice(previousCallerIdx, 1);
    },
    setExlcusivityCallerKeyDownV2(caller) {
        this._exclusivityCallerKeyDownV2.push(caller);
    },
    unsetExlcusivityCallerKeyDownV2(caller) {
        const previousCallerIdx = this._exclusivityCallerKeyDownV2.findIndex(obj => obj == caller);
        if (typeof previousCallerIdx === 'undefined')
            return;
        this._exclusivityCallerKeyDownV2.splice(previousCallerIdx, 1);
    },
    playPause() {
        this.player.playPause();
    },
    volumeUp() {
        this.player.increasVolume();
    },
    volumeDown() {
        this.player.decreasVolume();
    },
    nextTrack({ctrlKey, repeat}={}) {
        if (ctrlKey || repeat)
            return;
        this.player.next();
    },
    prevTrack({ctrlKey, repeat}={}) {
        if (ctrlKey || repeat)
            return;
        this.player.prev();
    },
    fastFoward({ctrlKey, repeat}={}) {
        if (ctrlKey && repeat)
            this.player.setCurrentTime(this.player.getCurrentTime() + 1);
    },
    rewind({ctrlKey, repeat}={}) {
        if (ctrlKey && repeat)
            this.player.setCurrentTime(this.player.getCurrentTime() - 1);
    },
    registerKeyUpAction(key, cb, caller) {
        if (!this._keyUpActions.hasOwnProperty(key))
            this._keyUpActions[key] = [];
        this._keyUpActions[key].push({cb, caller});
    },
    registerKeyDownAction(key, cb, caller) {
        if (!this._keyDownActions.hasOwnProperty(key))
            this._keyDownActions[key] = [];
        this._keyDownActions[key].push({cb, caller});
    },
    _bindEvents() {
        document.body.addEventListener('keyup', evt => this._dispatchActions.bind(this)(evt, 'up'));
        document.body.addEventListener('keydown', evt => this._dispatchActions.bind(this)(evt, 'down'));
    },
    _dispatchActions(evt, keyType) {
        if (keyType == 'up')
            return this._executeKeyUpActions(evt);
        else if (keyType == 'down')
            return this._executeKeyDownActions(evt);
    },
    _setUpBuiltinActions() {
        this.registerKeyUpAction(this.playPauseKey, this.playPause.bind(this), this);
        this.registerKeyDownAction(this.plusVolKey, this.volumeUp.bind(this), this);
        this.registerKeyDownAction(this.minusVolKey, this.volumeDown.bind(this), this);
        this.registerKeyUpAction(this.nextTrackKey, this.nextTrack.bind(this), this);
        this.registerKeyUpAction(this.prevTrackKey, this.prevTrack.bind(this), this);
        this.registerKeyDownAction(this.nextTrackKey, this.fastFoward.bind(this), this);
        this.registerKeyDownAction(this.prevTrackKey, this.rewind.bind(this), this);
    },
    _executeKeyDownActions(evt) {
        if (!this.isEnabled()) return;

        const key = evt.key;

        if (!this._keyDownActions.hasOwnProperty(key)) return;

        const exclusiveCallers = this._exclusivityCallerKeyDownV2;
        const actions = this._keyDownActions[key];
        
        if (actions && actions.length > 0) {
            for (let i = 0; i < actions.length; ++i) {
                let obj = actions[i];
                if (typeof obj.cb !== 'function')
                    continue;
                if (exclusiveCallers && exclusiveCallers.length > 0) {
                    exclusiveCallers.map(caller => obj.caller == caller && obj.cb({ctrlKey: evt.ctrlKey, shiftKey: evt.shiftKey, metaKey: evt.metaKey, repeat: evt.repeat, target: evt.target}));
                } else {
                    obj.cb({ctrlKey: evt.ctrlKey, shiftKey: evt.shiftKey, metaKey: evt.metaKey, repeat: evt.repeat, target: evt.target})
                }
            }
        }
    },
    _executeKeyUpActions(evt) {
        if (!this.isEnabled()) return;

        const key = evt.key;

        if (!this._keyDownActions.hasOwnProperty(key)) return;

        const exclusiveCallers = this._exclusivityCallerKeyUpV2;
        const actions = this._keyUpActions[key];
        console.log('keyUp', actions, exclusiveCallers);
        if (actions && actions.length > 0) {
            for (let i = 0; i < actions.length; ++i) {
                let obj = actions[i];
                if (typeof obj.cb !== 'function')
                    continue;
                if (exclusiveCallers && exclusiveCallers.length > 0) {
                    exclusiveCallers.map(caller => obj.caller == caller && obj.cb({ctrlKey: evt.ctrlKey, shiftKey: evt.shiftKey, metaKey: evt.metaKey, repeat: evt.repeat, target: evt.target}));
                } else {
                    obj.cb({ctrlKey: evt.ctrlKey, shiftKey: evt.shiftKey, metaKey: evt.metaKey, repeat: evt.repeat, target: evt.target})
                }
            }
        }
    },
};

window.KeyCotrols = new KeyCotrols(new KeyValues);

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
        window.layoutHTML.renderLayout(this.layout.layoutName);
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


const TrackListBrowserRenderer = function(trackListBrowser, layout, elemEvent) {
    this.trackListBrowser = trackListBrowser;
    this.layout = layout;
    this.elemEvent = elemEvent;
    this.isRendered = false;
    this.layout.registerRenderCallback(this._render.bind(this));
    this._bindEVent();
};
TrackListBrowserRenderer.prototype = {
    load() {
        if (!this.isRendered) {
            this.isRendered = true;
        }
        this._displayFileBroserLayout();
        this.trackListBrowser.reload(false, true);
    },
    unload() {
        this.trackListBrowser.closeTrackExplorer();
        this.isRendered = false;
    },
    _bindEVent() {
        this.elemEvent.addEventListener('click', (evt) => {
           this.load();
        });
    },
    _displayFileBroserLayout() {
        window.layoutHTML.renderLayout(this.layout.layoutName);
    },
    _render(parentElem) {
        clearElementInnerHTML(parentElem);
        parentElem.className = 'track-browser';

        /* tracklist-head */
        const divTrackListHead = document.createElement('div');
        const divTracklistTitle = document.createElement('div');
        const divTracklistSearch = document.createElement('div');
        const divImgCnt = document.createElement('div');
        const imgELem = document.createElement('img');
        const divInputCnt = document.createElement('div');
        const InputSearchElem = document.createElement('input');

        divTrackListHead.className = 'tracklist-head';
        divTracklistTitle.innerText = 'Track list';
        divTracklistTitle.className = 'tracklist-title inline-block';
        divTracklistSearch.className = 'tracklist-search inline-block';
        divImgCnt.className = 'img-cnt inline-block';
        divInputCnt.className = 'input-cnt inline-block';
        InputSearchElem.className = 'search-input';
        imgELem.src = "/static/mag-glass2-white.svg";

        divImgCnt.appendChild(imgELem);
        divInputCnt.appendChild(InputSearchElem);
        divTracklistSearch.append(divImgCnt, divInputCnt);
        divTrackListHead.append(divTracklistTitle, divTracklistSearch);

        parentElem.append(divTrackListHead);

        /* tracklist-content-div */
        const tracklistContentDiv = document.createElement('div');
        const tracklistContentTable = document.createElement('table');
        const thead = document.createElement('thead');
        const trHead = document.createElement('tr');
        const thSmallCellNb = document.createElement('th');
        const thTitle = document.createElement('th');
        const thArtist = document.createElement('th');
        const thAlbum = document.createElement('th');
        const thSmallCellDuration = document.createElement('th');
        const thTrackPlay = document.createElement('th');
        const thAction = document.createElement('th');
        const tbody = document.createElement('tbody');
        
        const tracklistInfoCntDiv = document.createElement('div');
        const tracklistinfoNbSpan = document.createElement('span');
        const nbTracksSpan = document.createElement('span');
        const tracklistInfoDurationSpan = document.createElement('span');
        const durationTracksSpan = document.createElement('span');
        const totalTracksText = document.createTextNode(' Total Tracks');
        const totalDurationText = document.createTextNode(' Total Duration');

        tracklistInfoCntDiv.className = 'tracklist-info-cnt';
        tracklistinfoNbSpan.className = 'tracklist-info-nb';
        nbTracksSpan.className = 'nb-tracks';
        tracklistInfoDurationSpan.className = 'tracklist-info-duration';
        durationTracksSpan.className = 'duration-tracks';

        tracklistContentDiv.className = 'tracklist-content-div';
        tracklistContentTable.className = 'tracklist-content';
        thSmallCellNb.className = 'small-cell';
        thSmallCellDuration.className = 'small-cell';

        thSmallCellNb.innerText = 'N°';
        thTitle.innerText = 'Title';
        thArtist.innerText = 'Artist';
        thAlbum.innerText = 'Album';
        thSmallCellDuration.innerText = 'Duration';

        trHead.append(thSmallCellNb, thTitle, thArtist, thAlbum, thSmallCellDuration, thAction, thTrackPlay);
        thead.append(trHead);
        tracklistContentTable.append(thead, tbody);
        tracklistContentDiv.append(tracklistContentTable);

        tracklistInfoDurationSpan.append(durationTracksSpan, totalDurationText);
        tracklistinfoNbSpan.append(nbTracksSpan, totalTracksText);
        tracklistInfoCntDiv.append(tracklistinfoNbSpan, tracklistInfoDurationSpan);
        tracklistContentDiv.append(tracklistInfoCntDiv);
        parentElem.append(tracklistContentDiv);

        this.trackListBrowser.setElementBoxes(parentElem, tracklistContentTable, thead, tbody);
    }
}


window.layoutHTML = new LayoutHTML();

const Drawing = function(canvas) {
    this.canvas = canvas; //document.createElement("canvas");
};
Drawing.prototype = {
    setUp() {
        this.canvas.width = window.innerWidth - 36;
        this.canvas.height = window.innerHeight - 204;
        this.canvas.style.display = 'block';
        this.canvas.style.margin = 'auto';

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth - 36;
            canvas.height = window.innerHeight - 204;
        });
        
        document.body.appendChild(canvas);
        this.canvasCtx = canvas.getContext("2d");
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    },
};


(function main(window, document, undefined) {
    const mainTracklist = new TrackList();
    const imgList = [];
    const leftMenu = new LeftMenu();
    const api = window.playerApi;
    const audioPlayer = new AudioPlayer(mainTracklist);
    const trackListBrowser = new TrackListBrowser(mainTracklist, audioPlayer);
    const playlistCreationTool = new PlaylistCreationTool();
    const layoutHTML = window.layoutHTML;

    const windowContentElem = document.getElementById('window-content');
    const trackListBrowserLayout = new Layout(windowContentElem, 'tracklistBrowser');
    
    TrackEditor.tracklist = mainTracklist;

    layoutHTML.addHTMLLayout(trackListBrowserLayout);
    
    const trackListBrowserRenderer = new TrackListBrowserRenderer(
            trackListBrowser, 
            trackListBrowserLayout, 
            document.querySelector('#file-browser-action button.open-tracklist-browser')
    );

    //trackListBrowser.setTrackList(mainTracklist);

    leftMenu.init();
    playlistCreationTool.createPlaylist(mainTracklist);
    
    api.loadBGImages(function(res) {
        imgList.push(...res['img_list']);
        audioPlayer.init();
        
        api.loadTrackList(function(res) {
            for (let i in res['tracklist']) {
                let trackInfo = res['tracklist'][i];
                let track = new Track(trackInfo['track']),
                    id3Tags = new ID3Tags(trackInfo['ID3']);
                track.setID3Tags(id3Tags);
                track.setTrackDuration(id3Tags.getDuration());
                this.tracklist.addTrackToList(track);
            }
            this.setCurrentTrackFromTrackList(false);
        }.bind(audioPlayer));
        
        const fileBrowser = new FileBrowser(audioPlayer);
        const fileBrowserLayout = new Layout(windowContentElem, 'folderBroser');
        const fileBrowserRenderer = new FileBrowserRenderer(fileBrowser, fileBrowserLayout, document.querySelector('#file-browser-action button.open-file-browser'));
        

        layoutHTML.addHTMLLayout(fileBrowserLayout);

        fileBrowser.onSongAdded(trackListBrowser.addTrackToList.bind(trackListBrowser))

        document.querySelector('#file-browser-action button.open-playlist-create').addEventListener(
            'click',
            playlistCreationTool.displayPLaylistCreationStudio.bind(playlistCreationTool)
        );
        
        draw(0, true, 0);
    });

    const volumeCnt = document.querySelector('#volume-display');
    const volumeCntDisplay = document.querySelector('#volume-display .vol-val');
    const muteCnt = document.querySelector('#muted-display');
    const muteOn = document.querySelector('#muted-display #mute-on');
    const muteOff = document.querySelector('#muted-display #mute-off');

    audioPlayer.onVolumeChange((volume) => {
        volumeCntDisplay.innerText = Math.round(volume * 100);
    });

    const keyCotrols = window.KeyCotrols;

    keyCotrols.setPlayer(audioPlayer);

    keyCotrols.registerKeyDownAction('M', () => {
        audioPlayer.mute();
        muteCnt.style.display = 'block';
        if (audioPlayer.isMuted()) {
            muteOn.style.display = 'block';
            muteOff.style.display = 'none';
        } else {
            muteOn.style.display = 'none';
            muteOff.style.display = 'block';
        }

        setTimeout(() => {
            muteOn.style.display = 'none';
            muteOff.style.display = 'none';
            muteCnt.style.display = 'none';
        }, 1668);
    });
    keyCotrols.registerKeyDownAction('a', trackListBrowserRenderer.load.bind(trackListBrowserRenderer), trackListBrowserRenderer);
    keyCotrols.registerKeyDownAction('Escape', trackListBrowserRenderer.unload.bind(trackListBrowserRenderer), trackListBrowserRenderer);

    let volUpEvtId = -1;
    let volDownEvtId = -1;
    keyCotrols.registerKeyDownAction('+', () => {
        if (volUpEvtId >= 0) {
            clearTimeout(volUpEvtId);
            volUpEvtId = -1;
        }
        if (volDownEvtId >= 0) {
            clearTimeout(volDownEvtId);
            volDownEvtId = -1;
        }
        volumeCnt.style.opacity = 1;
        volumeCnt.style.display = 'block';
    });
    keyCotrols.registerKeyUpAction('+', () => {
        volUpEvtId = setTimeout(() => {
            fadeOut(volumeCnt, false, 0.35);
        }, 568);
    });
    
    keyCotrols.registerKeyDownAction('-',  () => {
        if (volDownEvtId >= 0) {
            clearTimeout(volDownEvtId);
            volDownEvtId = -1;
        }
        if (volUpEvtId >= 0) {
            clearTimeout(volUpEvtId);
            volUpEvtId = -1;
        }
        volumeCnt.style.opacity = 1;
        volumeCnt.style.display = 'block';
    });
    keyCotrols.registerKeyUpAction('-', () => {
        volDownEvtId = setTimeout(() => {
            fadeOut(volumeCnt, false, 0.35);
        }, 568);
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
    background.src = `http://jsradio.me:3600/static/${curImg}`;

    background.onload = function() {
        console.log('img loaded', background.width, background.height, canvas.width, canvas.height);
        let width = 0, height = 0, x = 0, y = 0;
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
            background.src = `http://jsradio.me:3600/${curImg}`;
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
        const dateText = getFormatedDate();
        for (let i = 0; i < bufferLength; i++) {
            let audioValue = dataArray[i];
            const barHeight = (audioValue + 140) * 2;
            posY = canvas.height - barHeight * 2 
            canvasCtx.fillStyle = `rgb(${Math.floor((barHeight / 1.4) + 140)}, 50, 50, 0.66)`;
            canvasCtx.fillRect(
                posX,
                posY,
                barWidth,
                barHeight * 2,
            );
            canvasCtx.font = "25px sans-serif";
            canvasCtx.textAlign = 'left';
            canvasCtx.fillStyle = `#f1f1f1`;
            canvasCtx.fillText(dateText, 10, 36);
            /*canvasCtx.font = "15px sans-serif";
            canvasCtx.textAlign = 'center';
            canvasCtx.fillStyle = `#f1f1f1`;
            canvasCtx.fillText(Math.abs(Math.round(audioValue).toString()), posX + 10, posY - 5, barWidth);*/
            posX += barWidth + 1;
        }
    };
})(this, document);
