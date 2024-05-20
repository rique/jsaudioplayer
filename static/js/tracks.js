(function(window, document, JSPlayer, undefined) {
    const {ListEvents, keyCotrols} = JSPlayer.EventsManager;
    const api = new JSPlayer.Api();
    const {TrackListManager} = JSPlayer.TrackListV2;

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
        this.index = 0;
    };
    Track.prototype = {
        setTrackDuration(duration) {
            this.trackDuration = duration;
        },
        setIndex(index) {
            this.index = index;
        },
        getIndex() {
            return this.index;
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
    
    const TrackEditor = {
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
                    const {track} = TrackListManager.getTrackByUUID(trackUUid);
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
            this.searchElemCnt.addEventListener('keyup', this.search.bind(this));
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

    window.JSPlayer.Tracks = {Track, ID3Tags, TrackSearch, TrackEditor};

})(this, document, window.JSPlayer);