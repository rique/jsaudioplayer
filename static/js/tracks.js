(function(window, document, JSPlayer, undefined) {
    const ListEvents = JSPlayer.EventsManager.ListEvents;
    const getRandomInt = JSPlayer.Utils.getRandomInt;

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
        this.currentTime = 0;
        this.isPlaying = false;
        this._eventTrack = new ListEvents();
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
            let remainigTime = this.getTrackDuration() - this.getCurrentTime();
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
            if (tag == 'title')
                this._id3TagsInstance.setTitle(value);
            else if (tag == 'artist')
                this._id3TagsInstance.setArtist(value);
            else if (tag == 'album')
                this._id3TagsInstance.setAlbum(value);
            this._eventTrack.trigger('onTagChange', tag, value);
        },
        onTagChange(cb, subscriber) {
            this._eventTrack.onEventRegister({cb, subscriber}, 'onTagChange');
        },
        onTagChangeUnsub(subscriber) {
            this._eventTrack.unsubscribeEVent({eventKey: 'onTagChange', subscriber});
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
            this.trackListEvents.trigger('onAddedToQueue', track);
        },
        hasQueue() {
            return this.addedToQueue.length > 0;
        },
        getQueueLength() {
            return this.addedToQueue.length;
        },
        getQueue() {
            return this.addedToQueue;
        },
        nextInQueue() {
            if (this.addedToQueue.length == 0) {
                console.log('No tracks left in queue');
                return this.getCurrentTrack();
            }
            this.currentTrack = this.addedToQueue.shift();
            this.trackListEvents.trigger('onDepletingQueue', this.currentTrack);
            return this.currentTrack;
        },
        isCurrentTrackInQueue() {
            return this.isTrackInQueue(this.getCurrentTrack());
        },
        isTrackInQueue(track) {
            return this.addedToQueue.find(tr => tr.trackUUid == track.trackUUid) !== undefined;
        },
        onDepletingQueue(cb, subscriber) {
            this.trackListEvents.onEventRegister({cb, subscriber}, 'onDepletingQueue');
        },
        onAddedToQueue(cb, subscriber) {
            this.trackListEvents.onEventRegister({cb, subscriber}, 'onAddedToQueue');
        },
        getCurrentTrack() {
            if (this.currentTrack != null)
                return this.currentTrack;
            if (this.tracksNumber > 0)
                return this.getTrackList()[this.trackIndex];
            return null;
        },
        getCurrentTrackIndex() {
            return this.trackIndex;
        },
        getTrackByUUID(trackUUid) {
            let tracks = this.tracklist.filter(trk => trk.trackUUid == trackUUid);
            if (tracks.length == 0)
                return;
    
            return tracks[0];
        },
        geTrackByIndex(trackIndex) {
            if (trackIndex > this.trackIndexMax)
                return;
            return this.tracklist[trackIndex];
        },
        removeTrackFromTracklistByUUID(trackUUid) {
            const trackIndx = this.getTrackIndexByUUID(trackUUid);
            if (!trackIndx)
                return false;
            const track = this.getTrackList().splice(trackIndx, 1)[0];
            this.substractTracklistTotalDuration(track.getTrackDuration());
            --this.tracksNumber;
            this.trackIndexMax = this.tracksNumber - 1;
            this.trackListEvents.trigger('onRemoveTrackFromTrackList', track);
            return true;
        },
        onRemoveTrackFromTrackList(cb, subscriber) {
            this.trackListEvents.onEventRegister({cb, subscriber}, 'onRemoveTrackFromTrackList');
        },
        getNextTrackInList() {
            if (this.hasQueue())
                return this.getQueue()[0];
    
            return this.getNextTrackInTrackList();
        },
        getNextTrackInTrackList() {
            const tracklist = this.getTrackList();
            if (this.isLastTrack())
                return tracklist[0];
            return tracklist[this.trackIndex + 1];
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
        onTrackIndexChange(cb, subscriber) {
            this.trackListEvents.onEventRegister({cb, subscriber}, 'onIndexChange');
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
        onShuffleTracklist(cb, subscriber) {
            this.trackListEvents.onEventRegister({cb, subscriber}, 'onShuffleTracklist');
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
                let j = Math.floor(getRandomInt(0, i + 1));
                //let j = Math.floor(Math.random() * (i + 1));
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

    window.JSPlayer.Tracks = {Track, TrackList, ID3Tags};

})(this, document, window.JSPlayer);