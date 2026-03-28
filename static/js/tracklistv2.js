/**
 * Track List Module
 * Provides a comprehensive implementation of the track list management system for the music player application.
 * The module includes the TrackList class, which manages the list of tracks, their order, and playback state, as well as the TrackListManager, which orchestrates the overall behavior of the track list and its interactions with other components of the application.
 * The TrackList class extends a base IndexList class that provides basic list management functionalities such as adding, removing, and navigating through items. The TrackList class adds specific logic for handling tracks, including loop mode, total duration calculation, and index management.
 * The TrackListManager handles higher-level operations such as shuffling the track list, managing the queue of upcoming tracks, and triggering events when tracks are added to the queue or when the track index changes. It also provides methods for retrieving the current track and its index, as well as checking if the current track is from the queue.
 * The module is designed to be easily integrated with other components of the application, such as the audio player and notifications, allowing for seamless management of the track list and its interactions with the user interface.
 * Overall, this module serves as a crucial component of the music player application, providing a robust and flexible system for managing the track list while ensuring efficient interactions with other components and enhancing the overall user experience.
 * The design allows for easy maintenance and scalability, as new features can be added to the track list management system without affecting existing functionality, ensuring that the application can continue to evolve and provide a rich user experience as new features are introduced.
 * In summary, this module provides a comprehensive implementation of the track list management system for the music player application, ensuring seamless integration with other components and enhancing the overall user experience through efficient track list management and interactions.
 */
import {ListEvents} from './event-manager.js';
import {shuffle} from './utils.js';


const IndexList = function() {
    this.index = -1;
    this.items = [];
};
IndexList.prototype = {
    getItems() {
        return this.items;
    },
    setItems(items) {
        this.items = items;
    },
    addItem(item) {
        this.items.push(item);
    },
    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index === -1) return;

        const [removed] = this.items.splice(index, 1);

        if (!removed)
            return {track: undefined, index: undefined};

        if (index <= this.index && this.index > 0)
            --this.index;

        return removed;

    },
    removeItemByIndex(index) {
        if (index >= this.items.length || index < 0) return;
        
        const [item] = this.items.splice(index, 1);

        if (index <= this.index && this.index > 0)
            --this.index;

        return {item, index};
    },
    moveItem(index, item) {
        this.items.splice(index, 0, item);
    },
    getIndex() {
        return this.index;
    },
    maxIndex() {
        if (this.items.length == 0)
            return 0;
        return this.items.length - 1;
    },
    current() {
        if (this.index < 0) {
            this.index = 0;
        }
        
        const item = this.items[this.index];
        const index = this.items.indexOf(item);
        return {item, index};
    },
    next() {
        if (this.index < this.maxIndex()) {
            ++this.index;
            const item = this.items[this.index];
            const index = this.items.indexOf(item);
            return {item, index};
        }

        return false;
    },
    previous() {
        if (this.index > 0) {
            --this.index;
            const item = this.items[this.index];
            const index = this.items.indexOf(item);
            return {item, index};
        }

        return false;
    },
    reset() {
        this.index = -1;
    },
    getItemByIndex(index) {
        const maxIndex = this.maxIndex();
        if (index < 0) {
            index = 0;
        } else if (index > maxIndex) {
            index = maxIndex;
        }
        
        this.index = index;

        return this.current();
    },
    length() {
        return this.items.length;
    },
    *[Symbol.iterator]() {
        yield* this.items;
    }
};


const TrackList = function() {
    IndexList.call(this);
    this.loop = false;
    this.tracklistTotalDuration = 0;
    this.uudiTrackMap = new Map();
};
TrackList.prototype = {
    addItem(track) {
        const index = this.items.length;
        this.items.push(track);
        this.uudiTrackMap.set(track.getTrackUUID(), {track, index});
        this.addToTrackListTotalDuration(track.getTrackDuration());
    },
    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index === -1) return;

        const [track] = this.items.splice(index, 1);

         if (!track)
            return {track: undefined, index: undefined};

        if (index <= this.index && this.index > 0)
            --this.index;

        this.uudiTrackMap.delete(track.getTrackUUID());
        this.substractTracklistTotalDuration(track.getTrackDuration());
        return {track, index};
    },
    removeItemByIndex(index) {
        const item = IndexList.prototype.removeItemByIndex.call(this, index);

        if (item) {
            const {item: track} = item;
            this.uudiTrackMap.delete(track.getTrackUUID());
            this.substractTracklistTotalDuration(track.getTrackDuration());
            return {track, index};
        }
        
        return {track: undefined, index: undefined};
    },
    setCurrent({track}) {
        if (typeof index === 'undefined') {
            if (!track) {
                console.error(`Invalid parameters`);
                return;
            }

            const index = this.items.indexOf(track);
            if (index === -1) {
                console.error(`Track ${track} not found!`);
                return;
            }

            this.index = index;
        }

    },
    enableLoop() {
        this.loop = true;
    },
    disableLoop() {
        this.loop = false;
    },
    current() {
        let track = IndexList.prototype.current.call(this);
        return {track: track.item, index: track.index};
    },
    next() {
        let track = IndexList.prototype.next.call(this);
        if (!track && this.loop) {
            this.index = 0;
            const item = this.items[this.index];
            track = {track: item, index: this.index};
        } else {
            track = {track: track.item, index: track.index};
        }

        return track;
    },
    previous() {
        let track = IndexList.prototype.previous.call(this);
        
        if (!track && this.loop) {
            this.index = this.maxIndex();
            const item = this.items[this.index];
            track = {track: item, index: this.index};
        }

        return track;
    },
    readNextTrack() {
        let track, 
            index;
        
        if (this.index < this.maxIndex())
            index = this.index + 1;
        else if (this.loop)
            index = 0;
        
        track = this.items[index];
        return {track, index};
    },
    isLastTrack() {
        return this.index >= this.maxIndex();
    },
    setTrackIndex(newIdx) {
        console.log('setTrackIndex', {newIdx, maxIndex: this.maxIndex()});
        this.index = newIdx;
    },
    switchTrackIndex(oldIndex, newIndex) {
        const tracklist = this.getItems();
        const trackItem = tracklist.splice(oldIndex, 1)[0];
        
        if (oldIndex == this.index) {
            this.index = newIndex;
        } else if (newIndex == this.index) {
            if (oldIndex < newIndex) 
                --this.index;
            else 
                ++this.index;
        } else if (oldIndex > newIndex && this.index < oldIndex && this.index > newIndex) {
            ++this.index;
        } else if (oldIndex < newIndex && this.index > oldIndex && this.index < newIndex) {
            --this.index;
        }

        this.moveItem(newIndex, trackItem);
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
    getTrackByUUID(uuid) {
        const track = this.uudiTrackMap.get(uuid);
        if (!track) {
            console.error(`Track with uuid ${uuid} not found!`);
            return false;
        }
        
        return track;
    },
    _formatTime(secTime) {
        if (isNaN(secTime)) return '00:00:00';

        const houres = parseInt(secTime / 3600);
        const mins = parseInt((secTime % 3600) / 60);
        const secs = parseInt(secTime % 60); 

        return [houres, mins, secs].map(unit => unit.toString()
                .padStart(2, '0'))
                .join(':');
    }
};


const QeueList = function() {
    this.trackList = new TrackList();
};
QeueList.prototype = {
    addToQueue({track}) {
        this.trackList.addItem(track);
    },
    getCurrentItem() {
        return this.currentItem;
    },
    removeFromQueue(index) {
        return this.trackList.removeItemByIndex(index);
    },
    nexInQueue() {
        this.currentItem = this.trackList.removeItemByIndex(0);
        return this.currentItem;
    },
    getByIndex(index) {
        return this.trackList.getItemByIndex(index);
    },
    hasQueue() {
        return this.trackList.length() > 0;
    },
    length() {
        return this.trackList.length();
    },
    switchTrackIndex(oldIndex, newIndex) {
        this.trackList.switchTrackIndex(oldIndex, newIndex);
    },
    *[Symbol.iterator]() {
        yield* this.trackList.getItems();
    }
};


const TrackListManager =  {
    queueList: new QeueList(),
    trackListEvents: new ListEvents(),
    setTracklist(tracklist) {
        this.tracklist = tracklist;
        if (this.isShuffle()) {
            this.shuffledTracklist = undefined;
            this._isShuffle = false;
        }
    },
    setPlaylist(playlist) {
        this.setTracklist(playlist.getTracklist());
    },
    getTrackList() {
        if (this.isShuffle())
            return this.shuffledTracklist;
        return this.tracklist;
    },
    reset() {
        this.getTrackList().reset();
    },
    addTrackToList(track) {
        if (!this.tracklist)
            this.tracklist = new TrackList();
        this.tracklist.enableLoop();
        this.tracklist.addItem(track);
        if (this.isShuffle())
            this.shuffledTracklist.addItem(track);
    },
    addToQueue(track) {
        this.queueList.addToQueue(track);
        this.trackListEvents.trigger('onAddedToQueue', track, this.queueList.length());
    },
    getNexTrack() {
        let track;
        const tracklist = this.getTrackList();
        if (this.doRepeatTrack) {
            track = this.queueList.getByIndex(0);
            if (!track) {
                track = tracklist.current();
            }
        } else {
            track = this.queueList.nexInQueue();
            if (!track.track) {
                this.queueIsPlaying = false;
                track = tracklist.next();
                this.lastTrack = tracklist.isLastTrack();
                if (this.queueDepleted) {
                    this.queueDepleted = false;
                    this.trackListEvents.trigger('onDepletingQueue', {track: null}, -1);
                }
            } else {
                this.queueIsPlaying = true;
                if (!this.queueList.hasQueue())
                    this.queueDepleted = true;
                this.trackListEvents.trigger('onDepletingQueue', track, this.queueList.length());
            }
        }
        console.log('nextTrack', {track, queueDepleted: this.queueDepleted});
        return track;
    },
    getPreviousTrack() {
        const tracklist = this.getTrackList();
        const track = tracklist.previous();
        this.lastTrack = tracklist.isLastTrack();
        this.queueIsPlaying = false;
        if (this.queueDepleted) {
            this.trackListEvents.trigger('onDepletingQueue', {track: null}, -1);
            this.queueDepleted = false;
        }

        return track;
    },
    reShuffle() {
        this.shuffleTracklist();
        const currentTrack = this.getTrackList().current();
        this.trackListEvents.trigger('onShuffleTracklist', currentTrack, currentTrack.index, this.isShuffle());
    },
    shuffle(conserveCurrentTrack) {
        let currentTrack;
        if (this.isShuffle()) {
            this.tracklist.setCurrent({track: this.shuffledTracklist.current()});
            this.shuffledTracklist = null;
            this._isShuffle = false;
            currentTrack = this.tracklist.current();
        } else {
            let trackIndex,
                curIndex = -1;
            if (conserveCurrentTrack === true) {
                trackIndex = this.tracklist.getIndex();
                curIndex = 0;
            }
            this.shuffleTracklist(trackIndex);
            currentTrack = this.shuffledTracklist.current();
            this.shuffledTracklist.setTrackIndex(curIndex);
        }
        
        this.trackListEvents.trigger('onShuffleTracklist', currentTrack, currentTrack.index, this.isShuffle());
    },
    shuffleTracklist(trackIndex) {
        this.shuffledTracklist = new TrackList();
        this.shuffledTracklist.enableLoop();
        
        const shuffledItems = shuffle([...this.tracklist.getItems()], trackIndex).map((track, index) => {
            track.setIndex(index);
            return track;
        });

        this._isShuffle = true;
        this.shuffledTracklist.setItems(shuffledItems);
    },
    getNextTrackInList() {
        let track = this.queueList.getByIndex(0);
        if (!track.track) {
            track = this.getTrackList().readNextTrack();
        }
        return track;
    },
    isLastTrack() {
        return this.lastTrack && !this.queueList.hasQueue();
    },
    getCurrentTrack() {
        const queueItem = this.queueList.getCurrentItem();
        if ((this.queueList.hasQueue() || this.queueDepleted) && queueItem.track)
            return queueItem;
        return this.getTrackList().current();
    },
    getCurrentTrackIndex(forceDefaultTracklist) {
        if (!forceDefaultTracklist && (this.queueList.hasQueue() || this.queueDepleted))
            return 0;
        return this.getTrackList().getIndex();
    },
    isCurrentTrackFromQueue() {
        return this.queueDepleted
    }, 
    switchRepeatMode(repeatMode) {
        this.setRepeatTrack(repeatMode == 2);
    },
    setRepeatTrack(repeate) {
        this.doRepeatTrack = repeate;
    },
    switchTrackIndex(oldIdx, newIdx, isQueue) {
        let tracklist;
        if (isQueue ) {
            if (this.queueIsPlaying) {
                --oldIdx;
                --newIdx;
            }
            tracklist = this.queueList;
        } else {
            tracklist = this.getTrackList();
        }

        tracklist.switchTrackIndex(oldIdx, newIdx);
    },
    isShuffle() {
        return this._isShuffle;
    },
    *forEachTrack() {
        for (let track of this.getTrackList()) {
            yield track;
        }
    },
    *forEachTrackInQueue() {
        let index = 0;
        for (let track of this.queueList) {
            yield {track, index};
            ++index;
        }
    },
    setTrackIndex(newIdx) {
        const tracklist = this.getTrackList();
        let oldIdx = tracklist.getIndex();
        tracklist.setTrackIndex(newIdx - 1);
        this.trackListEvents.trigger('onTrackManagerIndexChange', oldIdx, newIdx);
    },
    getTracksNumber() {
        return this.tracklist.length();
    },
    getTrackListTotalDuration(formated) {
        return this.tracklist.getTrackListTotalDuration(formated);
    },
    removeTrackFromTracklistByUUID(trackUUid) {
        const {index, track} = this.getTrackByUUID(trackUUid);

        if (typeof index !== 'undefined') {
            const removed = this.tracklist.removeItemByIndex(index);
            if (this.isShuffle()) {
                this.shuffledTracklist.removeItem(removed.track);
            }
            this.trackListEvents.trigger('onRemoveTrackFromTrackList', {index, track}, trackUUid, index);
            return {index, track};
        }

        return false;
    },
    getTrackByUUID(trackUUid) {
        return this.tracklist.getTrackByUUID(trackUUid) || {index: undefined, track: undefined};
    },
    onAddedToQueue(cb, subscriber) {
        this.trackListEvents.onEventRegister({cb, subscriber}, 'onAddedToQueue');
    },
    onDepletingQueue(cb, subscriber) {
        this.trackListEvents.onEventRegister({cb, subscriber}, 'onDepletingQueue');
    },
    onTrackManagerIndexChange(cb, subscriber) {
        this.trackListEvents.onEventRegister({cb, subscriber}, 'onTrackManagerIndexChange');
    },
    onShuffleTracklist(cb, subscriber) {
        this.trackListEvents.onEventRegister({cb, subscriber}, 'onShuffleTracklist');
    },
    onRemoveTrackFromTrackList(cb, subscriber) {
        this.trackListEvents.onEventRegister({cb, subscriber}, 'onRemoveTrackFromTrackList');
    }
};

Object.setPrototypeOf(TrackList.prototype, IndexList.prototype);

export {TrackListManager, TrackList};
