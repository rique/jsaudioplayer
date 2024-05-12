(function(window, document, undefined) {

    window.JSPlayer = window.JSPlayer || {};

    const KeyCotrols = function() {
        
        this.keyValues = {
            SPACE: ' ',
            PLUS: '+',
            MINUS: '-',
            T: 't',
            CAP_P: 'P',
            ArrowRight: 'ArrowRight',
            ArrowLeft: 'ArrowLeft',
        };

        this.playPauseKey = this.keyValues.SPACE;
        this.minusVolKey = this.keyValues.MINUS;
        this.plusVolKey = this.keyValues.PLUS;
        this.nextTrackKey = this.keyValues.ArrowRight;
        this.prevTrackKey = this.keyValues.ArrowLeft;
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
            
            this._executeActions(evt, actions, exclusiveCallers);
        },
        _executeKeyUpActions(evt) {
            if (!this.isEnabled()) return;
    
            const key = evt.key;
    
            if (!this._keyUpActions.hasOwnProperty(key)) return;
    
            const exclusiveCallers = this._exclusivityCallerKeyUpV2;
            const actions = this._keyUpActions[key];
            
            this._executeActions(evt, actions, exclusiveCallers);
        },
        _executeActions(evt, actions, exclusiveCallers) {
            if (actions && actions.length > 0) {
                for (let i = 0; i < actions.length; ++i) {
                    let obj = actions[i];
                    if (typeof obj.cb !== 'function')
                        continue;
                    if (exclusiveCallers && exclusiveCallers.length > 0) {
                        exclusiveCallers.forEach(caller => obj.caller == caller && obj.cb({ctrlKey: evt.ctrlKey, shiftKey: evt.shiftKey, metaKey: evt.metaKey, repeat: evt.repeat, target: evt.target}));
                    } else {
                        obj.cb({ctrlKey: evt.ctrlKey, shiftKey: evt.shiftKey, metaKey: evt.metaKey, repeat: evt.repeat, target: evt.target})
                    }
                }
            }
        }
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
        onEventRegister({cb, subscriber}, eventKey) {
            this._eventsRegistered.push({'eventKey': eventKey, 'subscriber': subscriber,  'event': new OneEvent(cb)});
        },
        unsubscribeEVent({eventKey, subscriber}) {
            const subInedx = this._eventsRegistered.findIndex(evt => evt.subscriber == subscriber && evt.eventKey == eventKey);
            if (typeof subInedx === 'undefined')
                return;
            this._eventsRegistered.splice(subInedx, 1);
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

    window.JSPlayer.EventsManager = {ListEvents, KeyCotrols: new KeyCotrols()};
})(this, document);