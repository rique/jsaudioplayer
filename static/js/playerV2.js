(function(window, document, JSPlayer, undefined) {
    const ListEvents = JSPlayer.EventsManager.ListEvents;
    const PlayerNotifications = JSPlayer.Notifications.PlayerNotifications;
    const whileMousePressed = JSPlayer.Utils.whileMousePressed;
    const whileMousePressedAndMove = JSPlayer.Utils.whileMousePressedAndMove;
    const {TrackListManager} = JSPlayer.TrackListV2;

    const AudioPlayer = function(audioPlayerProgressBar) {
        this.audioElem = new Audio();
        this.audioPlayerEvents = new ListEvents();
        this.audioPlayerProgressBar = audioPlayerProgressBar;
        this.volumeStep = 0.02;
        this.isPaused = true;
        //0 -> no repeat; 1 -> repeat all; 2 -> repeat one; 
        this.repeatMode = 0;
    
        this.mainVolumeBarElem = document.getElementById('main-volume-bar');
        this.volumeBarElem = document.getElementById('volume-bar');
    
        this.volUpBtn = document.querySelector('span.vol-up');
        this.volDownBtn = document.querySelector('span.vol-down');
    
        this.volumeVal = document.querySelector('span.vol-val');
    
        this._playerNotifications = PlayerNotifications;
    };
    AudioPlayer.prototype = {
        init() {
            this._setUpPlayer();
    
            whileMousePressed(this.volUpBtn, this.increasVolume.bind(this), 84);
            whileMousePressed(this.volDownBtn, this.decreasVolume.bind(this), 84);
            whileMousePressedAndMove(this.mainVolumeBarElem, this.changeVolume.bind(this));
            whileMousePressedAndMove(this.volumeBarElem, this.changeVolume.bind(this));
    
            TrackListManager.onTrackManagerIndexChange(() => {
                this.setCurrentTrackFromTrackList(false);
                this.play();
            });
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
        setTrackList(tracklist) {
            TrackListManager.setTracklist(tracklist);
        },
        getTrackList() {
            return TrackListManager.getTrackList();
        },
        setPlayerSong(track, trackIdx, autoPlay) {
            this.currentTrack = track;
            this.currentTrack.isPlaying = autoPlay;
            this.audioElem.src = `/static/tracks/${track.trackUUid}.mp3`;
            this.audioElem.onloadedmetadata = this.audioLoaded.bind(this);
            this.audioPlayerEvents.trigger('onPlayerSongChange', track, trackIdx);

            if (this._comingNextFired === true)
                this._playerNotifications.hideComingNext();
            
            this._comingNextFired = false;
            
            if (autoPlay === true)
                return this.play();
            return this.stop();
        },
        onPlayerSongChange(cb, subscriber) {
            this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onPlayerSongChange');
        },
        playPause() {
            if (this.isPaused)
                this.play();
            else
                this.pause();
            
            return this.isPaused;
        },
        onPlayPause(cb, subscriber) {
            this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onPlayPause');
        },
        play() {
            this.isPaused = false;
            this.currentTrack.isPlaying = true;
            this.audioPlayerEvents.trigger('onPlayPause', this.isPaused);
            this.audioElem.play();
        },
        pause() {
            this.isPaused = true;
            this.currentTrack.isPlaying = false;
            this.audioPlayerEvents.trigger('onPlayPause', this.isPaused);
            this.audioElem.pause();
        },
        stop() {
            this.pause();
            this.setCurrentTime(0);
            this.audioPlayerEvents.trigger('onStop');
        },
        onStop(cb, subscriber) {
            this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onStop');
        },
        next() {
            this.currentTrack.onTagChangeUnsub(this);
            this.audioPlayerEvents.trigger('onAudioEnded', this.currentTrack);
            this.setCurrentTrackFromTrackList(true, false);
        },
        prev() {
            if (this.getCurrentTime() > 3.6) {
                this.setCurrentTime(0);
                this._playerNotifications.hideComingNext();
                this._comingNextFired = false;
                this.audioPlayerEvents.trigger('onStop');
            } else {
                this.currentTrack.onTagChangeUnsub(this);
                this.audioPlayerEvents.trigger('onAudioEnded', this.currentTrack);
                this.setCurrentTrackFromTrackList(true, true);
            }
        },
        repeat() {
            if (this.repeatMode >= 2)
                this.repeatMode = 0;
            else
                ++this.repeatMode;
            this.audioPlayerEvents.trigger('onRepeatSwitch', this.repeatMode);
            return this.repeatMode;
        },
        onRepeatSwitch(cb, subscriber) {
            this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onRepeatSwitch');
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
        getDuration() {
            return this.audioElem.duration;
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
        shuffle() {
            TrackListManager.shuffle(!this.isPaused);
            this.audioPlayerEvents.trigger('onShuffle', TrackListManager.getTrackList());
            if (this.isPaused)
                this.setCurrentTrackFromTrackList(true);
        },
        onShuffle(cb, subscriber) {
            this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onShuffle');
        },
        isPlayerPaused() {
            return this.isPaused;
        },
        increasVolume() {
            let volume = this.audioElem.volume + this.volumeStep;
            this.setVolume(volume); 
        },
        decreasVolume() {
            let volume = this.audioElem.volume - this.volumeStep;
            this.setVolume(volume);
        },
        setCurrentTrackFromTrackList(autoPlay, prev) {
            let track, index;
            if (prev)
                ({track, index} = TrackListManager.getPreviousTrack());
            else
                ({track, index} = TrackListManager.getNexTrack());

            console.log('playing song', {track, index});
            if (!track) {
                console.error('Track could not be fetched from tracklist');
                return;
            }
            
            this.setPlayerSong(track, index, autoPlay);
        },
        audioLoaded() {
            this.audioPlayerProgressBar.progress();
        },
        audioEnded() {
            let autoPlay;
            this.audioPlayerEvents.trigger('onAudioEnded', this.currentTrack);
            
            console.log('audioEnded', {repeatMode: this.repeatMode, isLastTrack: TrackListManager.isLastTrack()});
            if (TrackListManager.isLastTrack()) {
                if (!this.repeatMode >= 1) {
                    console.log('End of session');
                    autoPlay = false;
                } else {
                    autoPlay = true;
                    if (this.repeatMode == 1) {
                        if (!TrackListManager.isShuffle())
                            TrackListManager.reset();
                        else {
                            TrackListManager.reShuffle();
                            this.audioPlayerEvents.trigger('onShuffle', TrackListManager.getTrackList());
                        }
                    }
                }
            } else {
                 autoPlay = true;
            }
            console.log({autoPlay});
            this.setCurrentTrackFromTrackList(autoPlay);
        },
        onAudioEnded(cb, subscriber) {
            this.audioPlayerEvents.onEventRegister({cb, subscriber}, 'onAudioEnded');
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
                const track = this.currentTrack;
                track.setCurrentTime(target.currentTime);
                
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
            const {track} = TrackListManager.getNextTrackInList();
            return track;
        },
        _updateVolumeBar(volume) {
            toHundredVolume = volume * 100;
            this.volumeVal.innerText = Math.round(toHundredVolume).toString();
    
            requestAnimationFrame(() => {
                this.volumeBarElem.style.width = `${toHundredVolume}%`;
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

    const AudioPlayerDisplay = function(audioPlayer) {
        this.audioPlayer = audioPlayer;
        this.audioPlayer.onPlayerSongChange(this.setTrack.bind(this));
        this.albumImg = document.getElementById('album-art');
        this.titleTrack = document.getElementById('track-title');
        this.artistName = document.getElementById('artist-name');
    
        this.nameTrackElem = document.getElementById('name-track');
        this.nameAlbumElem = document.getElementById('name-album');
        this.timeTrackElem = document.getElementById('time-track');

        //0 -> static; 1 -> reverse; 2 -> forward; 
        this.displayTrackTimeMode = 1;
        this.timeTrackElem.addEventListener('click', this.changeTrackTimeDisplayMode.bind(this));
    };
    AudioPlayerDisplay.prototype = {
        setTrack(track) {
            if (this.track) {
                this.track.onTagChangeUnsub(this);
                this.track.onCurrentTimeUpdateUnsub(this);
            }
            this.track = track;
            track.onTagChange(this.manageTag.bind(this), this);
            track.onCurrentTimeUpdate(this.updateTrackTime.bind(this), this);
            this.manageTags(track);
            this.updateTrackTime();
        },
        manageTags(track) {
            let title = track.getTitle();
            let album = track.getAlbum();
            if (album)
                album = ` ~ ${album}`;
            
            let artist = track.getArtist();
            
            if (!artist || typeof artist === 'undefined' || artist.length == 0)
                artist = 'N/A';
    
            this.nameAlbumElem.innerText = album;
            this.nameTrackElem.innerText = title;
            this.artistName.innerText = artist;
    
            track.getAlbumArt(track.trackUUid).then((albumart) => {
                if (!albumart)
                    return this.albumImg.src = "/static/albumart.jpg";

                const { data, format } = albumart;
                
                if (data.length == 0)
                    return this.albumImg.src = "/static/albumart.jpg";
                
                let imgData = data;
                this.albumImg.src = `data:${format};base64,${imgData}`;
            });
            
        },
        manageTag(tag, value) {
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
        changeTrackTimeDisplayMode() {
            if (this.displayTrackTimeMode == 2)
                this.displayTrackTimeMode = 0;
            else
                ++this.displayTrackTimeMode;
            this.updateTrackTime();
        },
        updateTrackTime() {
            const track = this.track;
            let formatedTrackTime;
            if (this.displayTrackTimeMode == 0)
                formatedTrackTime = track.getTrackDuration(true);
            else if (this.displayTrackTimeMode == 1)
                formatedTrackTime = track.getTimeRemaining(true);
            else
                formatedTrackTime = track.getCurrentTime(true);
            
            this.timeTrackElem.innerText = ` - [${formatedTrackTime}]`;
        }
    }

    JSPlayer.AudioPlayer = {AudioPlayer, AudioPlayerDisplay};

})(this, document, this.JSPlayer);