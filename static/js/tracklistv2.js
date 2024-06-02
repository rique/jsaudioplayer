(function(window, document, JSPlayer, undefined) {

    const {ListEvents} = JSPlayer.EventsManager;
    const {shuffle} = JSPlayer.Utils;

    const IndexList = function() {
        this.index = -1;
        this._length = 0;
        this.items = [];
    };
    IndexList.prototype = {
        getItems() {
            return this.items;
        },
        setItems(items) {
            this.items = items;
            this._length = items.length;
        },
        addItem(item) {
            this.items.push({item, index: this._length});
            ++this._length;
        },
        removeItem(item) {
            const index = this.items.findIndex(itm => itm.item == item)
            
            if (!index) return;

            const removed = this.items.splice(index, 1)[0];

            if (index <= this.index && this.index > 0)
                --this.index;

            --this._length;
            
            this._reorganizeIndexes();

            return removed;

        },
        removeItemByIndex(index) {
            if (index >= this._length || index < 0) return;
            
            const item = this.items.splice(index, 1)[0];
            
            if (index <= this.index && this.index > 0)
                --this.index;

            --this._length;

            this._reorganizeIndexes();

            return item;
        },
        moveItem(index, item) {
            this.items.splice(index, 0, item);
            this._reorganizeIndexes();
        },
        getIndex() {
            return this.index;
        },
        maxIndex() {
            if (this._length == 0)
                return 0;
            return this._length - 1;
        },
        current() {
            if (this.index < 0)
                return this.items[0];
            return this.items[this.index];
        },
        next() {
            if (this.index < this.maxIndex()) {
                ++this.index;
                return this.items[this.index];
            }

            return false;
        },
        previous() {
            if (this.index > 0) {
                --this.index;
                return this.items[this.index];
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
            return this._length;
        },
        *forEach() {
            yield* this.items;
        },
        _reorganizeIndexes() {
            for (let i = 0; i < this.items.length; ++i) {
                this.items[i].index = i;
            }
        }
    };

    const QeueList = function() {
        this.indexList = new TrackList();
    };
    QeueList.prototype = {
        addToQueue(item) {
            this.indexList.addItem(item);
        },
        getCurrentItem() {
            return this.currentItem;
        },
        removeFromQueue(index) {
            return this.indexList.removeItemByIndex(index);
        },
        nexInQueue() {
            this.currentItem = this.indexList.removeItemByIndex(0);
            return this.currentItem;
        },
        getByIndex(index) {
            return this.indexList.getItemByIndex(index);
        },
        hasQueue() {
            return this.indexList.length() > 0;
        },
        length() {
            return this.indexList.length();
        },
        switchTrackIndex(oldIndex, newIndex) {
            console.log('queue', {oldIndex, newIndex, curIndex: this.indexList.getIndex()})
            this.indexList.switchTrackIndex(oldIndex, newIndex);
        },
        *forEach() {
            let i = 0;
            for ({track} of this.indexList.forEach()) {
                yield {track, index: i};
                ++i;
            }
        }
    }

    const TrackList = function() {
        IndexList.call(this);
        this.loop = false;
        this.tracklistTotalDuration = 0;
    };
    TrackList.prototype = {
        addItem(track) {
            this.items.push({track, index: this._length});
            ++this._length;
            this.addToTrackListTotalDuration(track.getTrackDuration());
        },
        removeItem(item) {
            const index = this.items.findIndex(itm => itm.track == item)
            
            if (!index) return;

            const removed = this.items.splice(index, 1)[0];

            if (index <= this.index && this.index > 0)
                --this.index;

            --this._length;
            
            this._reorganizeIndexes();
            
            if (removed) {
                const {track, index} = removed;
                this.substractTracklistTotalDuration(track.getTrackDuration());
                return {track, index};
            }
            
            return {track: undefined, index: undefined};
        },
        removeItemByIndex(index) {
            const item = IndexList.prototype.removeItemByIndex.call(this, index);

            if (item) {
                const {track} = item;
                this.substractTracklistTotalDuration(track.getTrackDuration());
                return {track, index};
            }
            
            return {track: undefined, index: undefined};
        },
        setCurrent({track, index}) {
            if (typeof index === 'undefined') {
                if (!track) {
                    console.error(`Invalid parameters`);
                    return;
                }
                console.log({track});
                ({index} = this.items.find(itm => itm.track.trackUUid == track.trackUUid));

                if (!index) {
                    console.error(`Track ${track} not found!`);
                    return;
                }
                console.log({index});
                this.index = index;
            }

        },
        enableLoop() {
            this.loop = true;
        },
        disableLoop() {
            this.loop = false;
        },
        next() {
            let track = IndexList.prototype.next.call(this);

            if (!track && this.loop) {
                this.index = 0;
                track = this.items[this.index];
            }

            return track;
        },
        previous() {
            let track = IndexList.prototype.previous.call(this);
            
            if (!track && this.loop) {
                this.index = this.maxIndex();
                track = this.items[this.index];
            }

            return track;
        },
        readNextTrack() {
            let track;
            if (this.index < this.maxIndex()) {
                track = this.items[this.index + 1];
            } else if (this.loop) {
                track = this.items[0];
            }

            return track;
        },
        isLastTrack() {
            return this.index >= this.maxIndex();
        },
        setTrackIndex(newIdx) {
            this.index = newIdx;
        },
        switchTrackIndex(oldIndex, newIndex) {
            const tracklist = this.getItems();
            const trackItem = tracklist.splice(oldIndex, 1)[0];
            const index1 = this.index;
            
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
            console.log({oldIndex, newIndex, index1, index2: this.index, trackItem});
            this.moveItem(newIndex, trackItem);
            console.log({oldIndex: tracklist[oldIndex], newIndex: tracklist[newIndex]})
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
        addToQueue({track, index}) {
            this.queueList.addToQueue(track);
            this.trackListEvents.trigger('onAddedToQueue', {track, index}, this.queueList.length());
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
                    this.lastTrack = tracklist.isLastTrack();
                    track = tracklist.next();
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
                this.tracklist.setCurrent({track: this.shuffledTracklist.current().track});
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
                this.shuffledTracklist.setTrackIndex(curIndex);
                currentTrack = this.shuffledTracklist.current();
            }
            this.trackListEvents.trigger('onShuffleTracklist', currentTrack, currentTrack.index, this.isShuffle());
        },
        shuffleTracklist(trackIndex) {
            this.shuffledTracklist = new TrackList();
            this.shuffledTracklist.enableLoop();
            const shuffledItems = shuffle([...this.tracklist.getItems()], trackIndex).map(({track}, index) => {
                track.setIndex(index);
                return {track, index};
            });

            this._isShuffle = true;
            this.shuffledTracklist.setItems(shuffledItems);
        },
        getNextTrackInList() {
            let track = this.queueList.getByIndex(0);
            if (!track) {
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
            console.log({trackIdx: this.getTrackList().getIndex()});
        },
        isShuffle() {
            return this._isShuffle;
        },
        *forEachTrack() {
            for (let track of this.getTrackList().forEach()) {
                yield track;
            }
        },
        *forEachTrackInQueue() {
            for (let track of this.queueList.forEach()) {
                yield track;
            }
        },
        setTrackIndex(newIdx, doSetCurTrack) {
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

            if (index) {
                const removed = this.tracklist.removeItemByIndex(index);
                if (this.isShuffle()) {
                    this.shuffledTracklist.removeItem(removed.track);
                }

                this.trackListEvents.trigger('onRemoveTrackFromTrackList', {index, track}, trackUUid, index);
                return true;
            }

            return false;
        },
        getTrackByUUID(trackUUid) {
            let trackToSearch,
                trackIndex;
            for ({index, track} of this.tracklist.forEach()) {
                if (track.trackUUid == trackUUid) {
                    trackIndex = index;
                    trackToSearch = track;
                    break;
                }
            }

            return {index: trackIndex, track: trackToSearch};
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

    JSPlayer.TrackListV2 = {TrackListManager, TrackList};
    
})(this, document, JSPlayer);