/** Tracks Module
 * Defines the Track class and related functionality for managing track metadata, album art, and interactions with the audio player and tracklist browser.
 * The Track class encapsulates properties such as title, artist, album, duration, and current playback time, as well as methods for updating and retrieving this information.
 * Integrates with the ID3Tags class to manage track metadata and the AlbumArtLoader for fetching album art asynchronously.
 * Provides a TrackEditor object for handling inline editing of track metadata within the tracklist grid.
 * The module is designed to be extensible and integrates with other components of the application, such as notifications and the audio player display.
 */
import {ListEvents, keyCotrols} from "./event-manager.js"
import Api from "./api.js";
import {TrackListManager} from "./tracklistv2.js";
import {AlbumArtLoader} from "./track-loader.js";

const api = new Api();

const ID3Tags = function(tags) {
    this.tags = tags;
    this.albumArtLoader = AlbumArtLoader;
    // this.defaultALbumArt = "/static/albumart.svg";
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
    async getAlbumArt(id) {
        const objectPromise = await this.albumArtLoader.getByIdAsync(id);

        const data = objectPromise?.object?.id3?.picture?.data;
        const format = objectPromise?.object?.id3?.picture?.format;

        if (data && data.length > 0 && format)
            return `data:${format};base64,${data}`;
        
        return this.defaultALbumArt;
    },
    getDuration() {
        return this.duration;
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
    getDefaultAlbumArt() {
        return this.defaultALbumArt;
    },
    getTags() {
        return this.tags;
    },
    _manageTags(tags) {
        this.title = tags.title;
        this.album = tags.album;
        this.artist = tags.artist;
        this.duration = tags.duration;
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
    getTrackUUID() {
        return this.trackUUid;
    },
    getTrackDuration(formated) {
        if (formated)
            return this.formatTrackDuration();
        return this.trackDuration;
    },
    setCurrentTime(val) {
        this.currentTime = val;
        this._eventTrack.trigger('onCurrentTimeUpdate', val);
    },
    onCurrentTimeUpdate(cb, subscriber) {
        this._eventTrack.onEventRegister({cb, subscriber}, 'onCurrentTimeUpdate');
    },
    onCurrentTimeUpdateUnsub(subscriber) {
        this._eventTrack.unsubscribeEVent({eventKey: 'onCurrentTimeUpdate', subscriber})
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
            this.trackDuration = id3Tags.getDuration()
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
    async getAlbumArt() {
        return await this._id3TagsInstance.getAlbumArt(this.trackUUid);
    },
    getID3Tags() {
        return this._id3TagsInstance;//.getTags();
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

export {Track, ID3Tags, TrackSearch, TrackEditor};
