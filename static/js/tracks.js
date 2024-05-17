(function(window, document, JSPlayer, undefined) {
    const ListEvents = JSPlayer.EventsManager.ListEvents;
    const getRandomInt = JSPlayer.Utils.getRandomInt;
    const keyCotrols = JSPlayer.EventsManager.KeyCotrols;
    const api = new JSPlayer.Api();

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
        this.tracksInQueue = false;
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
        getCurrentTrackIndex() {
            return this.trackIndex;
        },
        getQueueIndex() {
            return 0;
        },
        switchTrackIndex(oldIndex, newIndex) {
            const tracklist = this.getTrackList();
            const trackIndex = this.trackIndex
            let theTrack1 = tracklist[oldIndex], theTrack2 = tracklist[newIndex];
            console.log({newIndex, oldIndex, theTrack1, theTrack2});
            console.log('----------------------------------------------------------------------------');
            console.log('switchTrackIndex1', {trackIndex, oldIndex, newIndex});
            if (oldIndex == this.trackIndex)
                this.trackIndex = newIndex;
            else if (newIndex == this.trackIndex)
                --this.trackIndex;
            else if (oldIndex > newIndex && this.trackIndex < oldIndex && this.trackIndex > newIndex) {
                ++this.trackIndex;
            } else if (oldIndex < newIndex && this.trackIndex > oldIndex && this.trackIndex < newIndex) {
                --this.trackIndex;
            }
            console.log('switchTrackIndex2', {trackIndexResult: this.trackIndex});
            console.log('----------------------------------------------------------------------------');
            tracklist.splice(newIndex, 0, tracklist.splice(oldIndex, 1)[0]);
            theTrack1 = tracklist[oldIndex];
            theTrack2 = tracklist[newIndex];
            console.log({newIndex, oldIndex, theTrack1, theTrack2});
        },
        addToQueue(track) {
            if (!this.tracksInQueue)
                this.tracksInQueue = true;
            ++this.tracksInQueue;
            this.addedToQueue.push(track);
            this.trackListEvents.trigger('onAddedToQueue', track, this.addedToQueue.length);
        },
        hasQueue() {
            return this.tracksInQueue;
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
                this.tracksInQueue = false;
                this.currentTrack = undefined;
                this.trackListEvents.trigger('onDepletingQueue', null, -1);
                ++this.trackIndex;
                return {track: this.getCurrentTrack(), trackIdx: this.trackIndex};
            }
            this.currentTrack = this.addedToQueue.shift();
            this.trackListEvents.trigger('onDepletingQueue', this.currentTrack, this.addedToQueue.length);
            //{track, trackIdx}
            return {track: this.currentTrack, trackIdx: 0};
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
            if (typeof this.currentTrack !== 'undefined' && this.currentTrack != null)
                return this.currentTrack;
            if (this.tracksNumber > 0) {
                return this.getTrackList()[this.trackIndex];
            }
                
            return null;
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
            return {trackIndx, track};
        },
        onRemoveTrackFromTrackList(cb, subscriber) {
            this.trackListEvents.onEventRegister({cb, subscriber}, 'onRemoveTrackFromTrackList');
        },
        getNextTrackInList() {
            if (this.getQueue().length > 0)
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
            const oldIdx = this.trackIndex;
            this.trackIndex = indexVal;
            if (doSetCurTrack === true)
                this._setCurrentTrack();
            this.trackListEvents.trigger('onIndexChange', oldIdx, indexVal);
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
            this.trackListEvents.trigger('onShuffleTracklist', tracklist, this.isShuffle);
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
        *iterOverTrack(iterQueue) {
            const tracklist = iterQueue ? this.addedToQueue : this.isShuffleOn() ? this.tracklistShuffle : this.tracklist;
            for (let index = 0; index < tracklist.length; ++index) {
                yield {index, track: tracklist[index]};
            }
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

    const TrackEditor = {
        tracklist: '',
        onclickCell() {
            this._setExclusivity();
        },
        onValidate(evt, cell, value, oldValue) {
            this._unsetExclusivity();
            const trackUUid = cell.data('trackId');
            const fieldType = cell.data('fieldType');

            if (oldValue == value) {
                cell.innerContent(oldValue);
                return;
            }

            api.editTrack(fieldType, value, trackUUid, (res) => {
                if (res.success) {
                    cell.innerContent(value);
                    const track = this.tracklist.getTrackByUUID(trackUUid);
                    track.setTag(fieldType, value);
                } else {
                    cell.innerContent(oldValue);
                }
            });
            
        },
        _setExclusivity() {
            keyCotrols.setExlcusivityCallerKeyUpV2(this);
            keyCotrols.setExlcusivityCallerKeyDownV2(this);
        },
        _unsetExclusivity() {
            keyCotrols.unsetExlcusivityCallerKeyUpV2();
            keyCotrols.unsetExlcusivityCallerKeyDownV2();
        },
    };

    const TrackSearch = function(searchableGrid) {
        this.searchEvents = new ListEvents();
        this.term = '';
        this.searchableGrid = searchableGrid;
    }
    TrackSearch.prototype = {
        init() {
            this.magGlassElem = document.querySelector('.tracklist-head .tracklist-search .img-cnt');
            this.searchElemCnt = document.querySelector('.tracklist-head .tracklist-search .input-cnt');
            this.searchInputElem = document.querySelector('.tracklist-head .tracklist-search .input-cnt .search-input');
            this.magGlassElem.addEventListener('click', this._toggleInputSearchVisibility.bind(this));
            this.searchInputElem.addEventListener('blur', this._closeSearch.bind(this));
            this.searchElemCnt.addEventListener('keyup', this.search.bind(this));
        },
        setTrackList(trackList) {
            this.tracklist = trackList;
        },
        search(evt) {
            this.result = this.searchableGrid.search(evt.target.value);
            this.searchEvents.trigger('onSearchResult', this.result);
        },
        onSearchResult(cb, subscriber) {
            this.searchEvents.onEventRegister({cb, subscriber}, 'onSearchResult');
        },
        onSearchVisibilityChange(cb, subscriber) {
            this.searchEvents.onEventRegister({cb, subscriber}, 'onSearchVisibilityChange');
        },
        _isSearchVisible() {
            return this.searchElemCnt.style.visibility == 'visible';
        },
        _toggleInputSearchVisibility() {
            if (!this._isSearchVisible()) {
                this._openSearch();
            } else {
                this._closeSearch();    
                this.searchableGrid.clearSearch();
            }
            this.searchEvents.trigger('onSearchVisibilityChange', this._isSearchVisible());
        },
        _openSearch() {
            this._setExclusivity();
            this.searchElemCnt.style.visibility = 'visible';
            this.searchInputElem.focus();
        },
        _closeSearch() {
            this._unsetExclusivity();
            this.searchElemCnt.style.visibility = 'hidden';
            this.term = '';
            this.searchInputElem.value = '';
        },
        _setExclusivity() {
            console.log('Setting exclusivity');
            keyCotrols.setExlcusivityCallerKeyUpV2(this);
            keyCotrols.setExlcusivityCallerKeyDownV2(this);
        },
        _unsetExclusivity() {
            console.log('Unsetting exclusivity');
            keyCotrols.unsetExlcusivityCallerKeyUpV2(this);
            keyCotrols.unsetExlcusivityCallerKeyDownV2(this);
        },
    }

    const TrackListManager =  {
        tracksInQueue: [],
        trackIdx: -1,
        queueDepleted: false,
        trackListEvents: new ListEvents(),
        setTracklist(tracklist) {
            this.tracklist = tracklist;
            this.currentTrack = tracklist.getCurrentTrack();
            this.trackIdx = -1;
        },
        reset() {
            this.tracklist.resetTrackListIndex();
            this.trackIdx = -1;
            this.currentTrack = this.tracklist.getCurrentTrack();
        },
        log() {
            console.log('tracklist', this.tracklist);
        },
        getTrackList() {
            return this.tracklist;
        },
        addToQueue(track) {
            this.tracksInQueue.push(track);
            this.trackListEvents.trigger('onAddedToQueue', track, this.tracksInQueue.length);
        },
        getNexTrack() {
            let trackIdx;
            if (this.tracksInQueue.length > 0) {
                this.currentTrack = this.tracksInQueue.shift();
                trackIdx = 0;
                if (this.tracksInQueue.length == 0)
                    this.queueDepleted = true;
                this.trackListEvents.trigger('onDepletingQueue', this.currentTrack, this.tracksInQueue.length);
            } else {
                if (this.trackIdx >= this.tracklist.trackIndexMax)
                    this.trackIdx = 0;
                else {
                    ++this.trackIdx;
                }
                this.tracklist.setTrackIndex(this.trackIdx, true)
                this.currentTrack = this.tracklist.getCurrentTrack();
                trackIdx = this.tracklist.getCurrentTrackIndex();
                if (this.queueDepleted) {
                    this.trackListEvents.trigger('onDepletingQueue', null, -1);
                    this.queueDepleted = false;
                }
            }
            console.log({thistrackIdx: this.trackIdx})
            return {track: this.currentTrack, trackIdx};
        },
        getPreviousTrack() {
            if (this.trackIdx <= 0)
                this.trackIdx = this.tracklist.trackIndexMax;
            else
                --this.trackIdx;

            if (this.queueDepleted) {
                this.trackListEvents.trigger('onDepletingQueue', null, -1);
                this.queueDepleted = false;
            }

            this.tracklist.setTrackIndex(this.trackIdx, true);
            this.currentTrack = this.tracklist.getCurrentTrack();

            return {track: this.currentTrack, trackIdx: this.trackIdx};
        },
        shuffle(conserveCurrentTrack) {
            this.tracklist.shuffle(conserveCurrentTrack);
            this.trackIdx = this.tracklist.getCurrentTrackIndex() - 1;
            console.log('trackindex', this.trackIdx);
            this.trackListEvents.trigger('onShuffleTracklist', this.tracklist, this.isShuffle());
        },
        reShuffle() {
            this.tracklist.shuffleTracklist();
            this.trackIdx = this.tracklist.getCurrentTrackIndex() - 1;
            this.trackListEvents.trigger('onShuffleTracklist', this.tracklist, this.isShuffle());
        },
        getNextTrackInList() {
            if (this.tracksInQueue.length > 0)
                return this.tracksInQueue[0];
            return this.tracklist.getNextTrackInList();
        },
        isLastTrack() {
            return this.tracklist.isLastTrack() && this.tracksInQueue.length == 0;
        },
        getCurrentTrack() {
            return this.currentTrack;
        },
        getCurrentTrackIndex() {
            if (this.tracksInQueue.length > 0 && this.queueDepleted)
                return 0;
            return this.trackIdx;
        },
        addTrackToList(track) {
            this.tracklist.addTrackToList(track);
        },
        repeatTrack() {
            --this.trackIdx;
        },
        switchTrackIndex(oldIdx, newIdx) {
            this.tracklist.switchTrackIndex(oldIdx, newIdx);
            this.trackIdx = this.tracklist.getCurrentTrackIndex();
            console.log('----------------------------------------------------------------------------');
            console.log({trackIdx: this.trackIdx})
        },
        isShuffle() {
            return this.tracklist.isShuffle;
        },
        *iterOverTrack() {
            for (let {index, track} of this.tracklist.iterOverTrack()) {
                yield {index, track};
            }
        },
        *iterOverQueue() {
            for (let index = 0; index < this.tracksInQueue.length; ++index) {
                yield {index, track: this.tracksInQueue[index]};
            }
        },
        setTrackIndex(newIdx, doSetCurTrack) {
            const oldIdx = this.trackIdx;
            this.tracklist.setTrackIndex(newIdx, doSetCurTrack);
            this.trackIdx = newIdx - 1;
            this.trackListEvents.trigger('onTrackManagerIndexChange', oldIdx, newIdx);
        },
        getTracksNumber() {
            return this.tracklist.getTracksNumber();
        },
        getTrackListTotalDuration(formated) {
            return this.tracklist.getTrackListTotalDuration(formated);
        },
        getTrackByUUID(trackUUid) {
            return this.tracklist.getTrackByUUID(trackUUid);
        },
        removeTrackFromTracklistByUUID(trackUUid) {
            return this.tracklist.removeTrackFromTracklistByUUID(trackUUid);
        },
        onAddedToQueue(cb, subscriber) {
            this.trackListEvents.onEventRegister({cb, subscriber}, 'onAddedToQueue');
        },
        onDepletingQueue(cb, subscriber) {
            this.trackListEvents.onEventRegister({cb, subscriber}, 'onDepletingQueue');
        },
        onTrackIndexChange(cb, subscriber) {
            this.tracklist.onTrackIndexChange(cb, subscriber);
        },
        onTrackManagerIndexChange(cb, subscriber) {
            this.trackListEvents.onEventRegister({cb, subscriber}, 'onTrackManagerIndexChange');
        },
        onShuffleTracklist(cb, subscriber) {
            this.trackListEvents.onEventRegister({cb, subscriber}, 'onShuffleTracklist');
        },
        onRemoveTrackFromTrackList(cb, subscriber) {
            this.tracklist.onRemoveTrackFromTrackList(cb, subscriber);
        }
    };

    window.JSPlayer.Tracks = {Track, TrackList, ID3Tags, TrackSearch, TrackEditor, TrackListManager};

})(this, document, window.JSPlayer);