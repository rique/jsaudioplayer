(function(window, document, JSPlayer, undefined) {

    const {ListEvents} = JSPlayer.EventsManager;
    const {shuffle} = JSPlayer.Utils;

    const IndexList = function() {
        this.index = -1;
        this.length = 0;
        this.items = [];
    };
    IndexList.prototype = {
        setItems(items) {
            this.length = items.length;
            this.index = -1;
            this.items = items;
        },
        getItems() {
            return this.items;
        },
        addItem(item) {
            this.items.push({item, index: this.length});
            ++this.length;
        },
        removeItemByIndex(index) {
            if (index >= this.length || index < 0)
                return;
            const item = this.items.splice(index, 1)[0];
            
            if (index <= this.index && this.index > 0) {
                --this.index;
            }
            
            --this.length;

            return item;
        },
        updateItem(item, index) {
            this.items[index] = item;
        },
        swapItem(itemA, itemB) {
            this.items[itemA.index] = itemB;
            this.items[itemB.index] = itemA;
        },
        getIndex() {
            return this.index;
        },
        maxIndex() {
            if (this.length == 0)
                return 0;
            return this.length - 1;
        },
        current() {
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
            this.index = 0;
        },
        getItemByIndex(index) {
            const maxInex = this.maxIndex();
            if (index < 0) {
                index = 0;
            } else if (index > maxInex) {
                index = maxInex;
            }
            
            this.index = index;

            return this.current();
        },
        getLength() {
            return this.length;
        },
        *forEach() {
            for (let i = 0; i < this.length; ++i) {
                let item = this.items[i];
                yield item;
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
            return this.indexList.getLength() > 0;
        },
        length() {
            return this.indexList.getLength();
        },
        *forEach() {
            for ({track, index} of this.indexList.forEach()) {
                yield {track, index: 0};
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
            this.items.push({track, index: this.length});
            ++this.length;
            this.addToTrackListTotalDuration(track.getTrackDuration());
        },
        removeItemByIndex(index) {
            const item = IndexList.prototype.removeItemByIndex.call(this, index);

            if (item) {
                const {track} = item;
                this.substractTracklistTotalDuration(track.getTrackDuration());
                return {track, index};
            }
            
        },
        enableLoop() {
            this.loop = true;
        },
        disableLoop() {
            this.loop = false;
        },
        next() {
            if (this.index < this.maxIndex()) {
                ++this.index;
                return this.items[this.index];
            } else if (this.loop) {
                this.index = 0;
                return this.items[this.index];
            }

            return false;
        },
        previous() {
            let track;
            if (this.index > 0) {
                --this.index;
                track = this.items[this.index];
            } else if (this.loop) {
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
            return this.index >= this.length;
        },
        setTrackIndex(newIdx) {
            this.index = newIdx;
        },
        switchTrackIndex(oldIndex, newIndex) {
            const tracklist = this.getItems();
            const trackIndex = this.index;
            const trackItem = tracklist.splice(oldIndex, 1)[0];
            const trackReplace = tracklist[newIndex];

            console.log({newIndex, oldIndex, trackItem, trackReplace});
            console.log('----------------------------------------------------------------------------');
            console.log('switchTrackIndex1', {trackIndex, oldIndex, newIndex, trackItem, trackReplace});
            if (oldIndex == this.index)
                this.index = newIndex;
            else if (newIndex == this.index)
                --this.index;
            else if (oldIndex > newIndex && this.index < oldIndex && this.index > newIndex) {
                ++this.index;
            } else if (oldIndex < newIndex && this.index > oldIndex && this.index < newIndex) {
                --this.index;
            }
            console.log('switchTrackIndex2', {trackIndexResult: this.index});
            console.log('----------------------------------------------------------------------------');
            tracklist.splice(newIndex, 0, trackItem);
            //this.swapItem(theTrack1, theTrack2);
            this._reorganizeIndexes();
            console.log({newIndex, oldIndex, trackItem, trackReplace});
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
        },
        _reorganizeIndexes() {
            for (let i = 0; i < this.items.length; ++i) {
                this.items[i].index = i;
            }
        }
    };

    const TrackListManager =  {
        queueList: new QeueList(),
        tracklist: null,
        shuffledTracklist: null,
        queueDepleted: false,
        trackListEvents: new ListEvents(),
        setTracklist(tracklist) {
            this.tracklist = tracklist;
            const {track, index} = tracklist.current();
            this.trackIdx = index;
            this.currentTrack = track;
        },
        reset() {
            this.tracklist.reset();
            this.trackIdx = -1;
            this.currentTrack = this.tracklist.current();
        },
        getTrackList() {
            return this.tracklist;
        },
        addToQueue({track, index}) {
            this.queueList.addToQueue(track);
            this.trackListEvents.trigger('onAddedToQueue', {track, index}, this.queueList.length());
        },
        getNexTrack() {
            let track;
            
            if (this.doRepeatTrack) {
                track = this.queueList.getByIndex(0);
                if (!track) {
                    if (this.isShuffle()) {
                        track = this.shuffledTracklist.current();
                    } else {
                        track = this.tracklist.current();
                    }
                }
                this.doRepeatTrack = false;
            } else {
                track = this.queueList.nexInQueue();
                if (!track) {
                    if (this.isShuffle()) {
                        track = this.shuffledTracklist.next();
                    } else {
                        track = this.tracklist.next();
                    }
                    if (this.queueDepleted) {
                        this.trackListEvents.trigger('onDepletingQueue', {track: null}, -1);
                        this.queueDepleted = false;
                    }
                } else {
                    this.trackListEvents.trigger('onDepletingQueue', track, this.queueList.length());
                    if (this.queueList.length() == 0)
                        this.queueDepleted = true;
                }
            }
            console.log('nextTrack', {track});
            return track;
        },
        getPreviousTrack() {
            const track = this.tracklist.previous();
            const trackIdx = this.tracklist.getIndex();

            if (this.queueDepleted) {
                this.trackListEvents.trigger('onDepletingQueue', null, -1);
                this.queueDepleted = false;
            }

            return {track, trackIdx};
        },
        reShuffle() {
            this.shuffleTracklist();
            this.trackListEvents.trigger('onShuffleTracklist', this.tracklist, this.isShuffle());
        },
        shuffle(conserveCurrentTrack) {
            let tracklist;
            if (this.isShuffle()) {
                this.shuffledTracklist = null;
                this._isShuffle = false;
                tracklist = this.tracklist.getItems();
            } else {
                let trackIndex;
                if (conserveCurrentTrack === true)
                    trackIndex = this.tracklist.getIndex();
                this.shuffleTracklist(trackIndex);
                tracklist = this.shuffledTracklist.getItems();
            }
            this.trackListEvents.trigger('onShuffleTracklist', tracklist, this.isShuffle());
        },
        shuffleTracklist(trackIndex) {
            this.shuffledTracklist = new TrackList();
            const shuffledItems = shuffle([...this.tracklist.getItems()], trackIndex).map(({track}, index) => {
                track.setIndex(index);
                return {track, index};
            });
            console.log({shuffledItems});
            this._isShuffle = true;
            this.shuffledTracklist.setItems(shuffledItems);
        },
        getNextTrackInList() {
            let track = this.queueList.getByIndex(0);
            if (!track) {
                if (this.isShuffle())
                    track = this.shuffledTracklist.readNextTrack();
                else
                    track = this.tracklist.readNextTrack();
            }
            return track;
        },
        isLastTrack() {
            return this.tracklist.isLastTrack() && !this.queueList.hasQueue();
        },
        getCurrentTrack() {
            const queueItem = this.queueList.getCurrentItem();
            if ((this.queueList.hasQueue() || this.queueDepleted) && queueItem)
                return queueItem;
            if (this.isShuffle())
                return this.shuffledTracklist.current();
            return this.tracklist.current();
        },
        getCurrentTrackIndex(forceDefaultTracklist) {
            if (!forceDefaultTracklist && (this.queueList.hasQueue() || this.queueDepleted))
                return 0;
            if (this.isShuffle())
                return this.shuffledTracklist.getIndex();
            return this.tracklist.getIndex();
        },
        addTrackToList(track) {
            if (this.tracklist == null)
                this.tracklist = new TrackList();
            this.tracklist.addItem(track);
            if (this.isShuffle())
                this.shuffledTracklist.addItem(track);
        },
        repeatTrack() {
            this.doRepeatTrack = true;
        },
        switchTrackIndex(oldIdx, newIdx) {
            console.log('----------------------------------------------------------------------------');
            if (this.isShuffle()) {
                this.shuffledTracklist.switchTrackIndex(oldIdx, newIdx);
                console.log({trackIdxShuffle: this.shuffledTracklist.getIndex()});
            } else {
                this.tracklist.switchTrackIndex(oldIdx, newIdx);
                console.log({trackIdx: this.tracklist.getIndex()});
            }
        },
        isShuffle() {
            return this._isShuffle;
        },
        *iterOverTrack() {
            let tracklist;
            if (this.isShuffle()) {
                tracklist = this.shuffledTracklist;
            } else {
                tracklist = this.tracklist;
            }

            for (let track of tracklist.forEach()) {
                yield track;
            }
        },
        *iterOverQueue() {
            for (let track of this.queueList.forEach()) {
                yield track;
            }
        },
        setTrackIndex(newIdx, doSetCurTrack) {
            let oldIdx;
            if (this.isShuffle()) {
                oldIdx = this.shuffledTracklist.getIndex();
                this.shuffledTracklist.setTrackIndex(newIdx - 1);
            } else {
                oldIdx = this.tracklist.getIndex();
                this.tracklist.setTrackIndex(newIdx - 1);
            }
            this.trackListEvents.trigger('onTrackManagerIndexChange', oldIdx, newIdx);
        },
        getTracksNumber() {
            return this.tracklist.getLength();
        },
        getTrackListTotalDuration(formated) {
            return this.tracklist.getTrackListTotalDuration(formated);
        },
        getTrackByUUID(trackUUid) {
            return this.tracklist.getTrackByUUID(trackUUid);
        },
        removeTrackFromTracklistByUUID(trackUUid) {
            const {index, track} = this.getTrackByUUID(trackUUid);
            if (index) {
                this.tracklist.removeItemByIndex(index);
                this.trackListEvents.trigger('onRemoveTrackFromTrackList', {index, track}, trackUUid, index);
            }
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
            this.trackListEvents.onEventRegister({cb, subscriber}, 'onRemoveTrackFromTrackList');
        }
    };

    Object.setPrototypeOf(TrackList.prototype, IndexList.prototype);

    JSPlayer.TrackListV2 = {TrackListManager};
    
})(this, document, JSPlayer);