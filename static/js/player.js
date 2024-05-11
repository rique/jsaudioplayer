(function(window, document, JSPlayer, undefined) {
    const ListEvents = JSPlayer.EventsManager.ListEvents;
    const PlayerNotifications = JSPlayer.Notifications.PlayerNotifications;
    const whileMousePressed = JSPlayer.Utils.whileMousePressed;
    const whileMousePressedAndMove = JSPlayer.Utils.whileMousePressedAndMove;

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
    
        this.playPauseBtn = document.querySelector('#play-button .player-action .fa-solid');
    
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
        this._playerNotifications = new PlayerNotifications();
    };
    AudioPlayer.prototype = {
        init() {
            this._setUpPlayer();
    
            this._setUpPlayerControls();
    
            this.shuffleBtn.addEventListener('click', this.shuffle.bind(this));
    
            this.progressBarDiv.addEventListener('mouseenter', (evt) => {
                percentWidth = (this._getPercentageWidthFromMousePosition(evt.clientX, this.progressBarDiv) * 100).toFixed(2);
                this.progressBarDiv.style.background = `linear-gradient(90deg, rgba(255, 124, 120, 0.6) ${percentWidth}%, #292929 0%)`;
            });
    
            this.progressBarDiv.addEventListener('mousemove', (evt) => {//3, 207, 252 - 255, 143, 143
                percentWidth = (this._getPercentageWidthFromMousePosition(evt.clientX, this.progressBarDiv) * 100).toFixed(2);
                this.progressBarDiv.style.background = `linear-gradient(90deg, rgba(255, 124, 120, 0.6) ${percentWidth}%, #292929 0%)`;
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
            this.audioElem.src = `/static/tracks/${track.trackUUid}.mp3`;
            this.audioElem.onloadedmetadata = this.audioLoaded.bind(this);
            this.audioPlayerEvents.trigger('playerSongChange');
            if (this._comingNextFired === true)
                this._playerNotifications.hideComingNext();
            
            this._comingNextFired = false;
            
            if (autoPlay === true)
                return this.play();
            return this.stop();
        },
        onPlayerSongChange(cb, subscriber) {
            this.audioPlayerEvents.onEventRegister({'cb': () => {
                cb(this.currentTrack);
            }, subscriber}, 'playerSongChange');
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
            this.currentTrack.onTagChangeUnsub(this);
            const hasQueue = this.tracklist.hasQueue();
            this.audioPlayerEvents.trigger('onAudioEnded', this.currentTrack, hasQueue);
            if (!hasQueue)
                this.tracklist.nextTrack();
            this.setCurrentTrackFromTrackList(true);
        },
        prev() {
            if (this.getCurrentTime() > 3.6) {
                this.setCurrentTime(0);
                this._playerNotifications.hideComingNext();
                this._comingNextFired = false;
            } else {
                this.currentTrack.onTagChangeUnsub(this);
                const hasQueue = this.tracklist.hasQueue();
                this.audioPlayerEvents.trigger('onAudioEnded', this.currentTrack, hasQueue);
                if (!hasQueue)
                    this.tracklist.previousTrack();
                this.setCurrentTrackFromTrackList(true);
            }
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
        onVolumeChange(cb, subscriber) {
            this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onVolumeChange');
        },
        mute() {
            this.audioElem.muted = !this.audioElem.muted;
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
        onShuffle(cb, subscriber) {
            this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onShuffle');
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
            track.onTagChange(this._manageTag.bind(this), this);
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
            this.progressBar(evt.target);
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
            this.audioPlayerEvents.trigger('onAudioEnded', this.currentTrack, hasQueue);
            this.currentTrack.onTagChangeUnsub(this);
            if (this.tracklist.isLastTrack() && !hasQueue) {
                if (!this.repeatMode >= 1) {
                    console.log('End of session');
                    this.tracklist.nextTrack();
                    autoPlay = false;
                } else {
                    autoPlay = true;
                    if (this.repeatMode == 1) {
                        if (!this.tracklist.isShuffleOn())
                            this.tracklist.resetTrackListIndex();
                        else {
                            this.tracklist.shuffleTracklist();
                            this.audioPlayerEvents.trigger('onShuffle', this.tracklist);
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
        onAudioEnded(cb, subscriber) {
            this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onAudioEnded');
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
                const target = evt.target;
                const duration = target.duration;
                const currentTime = target.currentTime;
    
                this.tracklist.getCurrentTrack().setCurrentTime(target.currentTime);
                
                if (this._checkForNextTrack(currentTime, duration) && !this._comingNextFired) {
                    this._fireNotification();
                    this._comingNextFired = true;
                }
            };
        },
        _checkForNextTrack(currentTime, duration) {
            if (duration - currentTime <= 30) 
                return true;
            return false;
        },
        _fireNotification() {
            this._playerNotifications.setComingNext(this._getNextTrackInList(), this.currentTrack.getTimeRemaining() * 1000);
        },
        _getNextTrackInList() {
            if (this.repeatMode == 2)
                return this.currentTrack;
            return this.tracklist.getNextTrackInList();
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
                album = ` ~ ${tags.album}`;
            
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
        _manageTag(tag, value) {
            switch(tag) {
                case 'artist':
                    this.artistName.innerText = value;
                    break;
                case 'album':
                    this.nameAlbumElem.innerText = ` ~ ${value}`;
                    break;
                case 'title':
                    this.nameTrackElem.innerText = value;
                    break;
            }
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

    JSPlayer.AudioPlayer = AudioPlayer;

})(this, document, this.JSPlayer);