(function(window, document, undefined) {

    window.JSPlayer = window.JSPlayer || {};

    const KeyCotrols = function() {
        this.enabled = true;
        this._keyDownActions = {};
        this._keyUpActions = {};
        this._exclusivityCallerKeyUp = [];
        this._exclusivityCallerKeyDown = [];
        this._exclusivityCallerKeyUpV2 = [];
        this._exclusivityCallerKeyDownV2 = [];
        
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
                    let {caller, cb} = actions[i];
                    if (typeof cb !== 'function')
                        continue;
                    if (exclusiveCallers && exclusiveCallers.length > 0) {
                        exclusiveCallers.forEach(clr => caller == clr && cb({ctrlKey: evt.ctrlKey, shiftKey: evt.shiftKey, metaKey: evt.metaKey, repeat: evt.repeat, target: evt.target}));
                    } else {
                        cb({ctrlKey: evt.ctrlKey, shiftKey: evt.shiftKey, metaKey: evt.metaKey, repeat: evt.repeat, target: evt.target})
                    }
                }
            }
        }
    };

    const AudioPlayerKeyControls = function(keyCotrols) {
        this.keyValues = {
            SPACE: ' ',
            PLUS: '+',
            MINUS: '-',
            T: 't',
            CAP_P: 'P',
            ArrowRight: 'ArrowRight',
            ArrowLeft: 'ArrowLeft',
        };

        this.keyCotrols = keyCotrols;
        this.listEvents = new ListEvents();
        this._setUpKeyBindings();
    };
    AudioPlayerKeyControls.prototype = {
        setAudioPlayer(audioPlayer) {
            console.log('AudioPlayerKeyControls.setAudioPlayer')
            if (typeof audioPlayer === 'undefined') {
                const e = new Error('A player is required!');
                console.error(e);
                throw e;
            }
            this.audioPlayer = audioPlayer;
        },
        playPause() {
            this.audioPlayer.playPause();
        },
        volumeUp() {
            this.audioPlayer.increasVolume();
        },
        volumeDown() {
            this.audioPlayer.decreasVolume();
        },
        nextTrack({ctrlKey, repeat}={}) {
            if (ctrlKey || repeat)
                return;
            this.audioPlayer.next();
        },
        prevTrack({ctrlKey, repeat}={}) {
            if (ctrlKey || repeat)
                return;
            this.audioPlayer.prev();
        },
        fastFoward({ctrlKey, repeat, shiftKey}={}) {
            if (ctrlKey && repeat || shiftKey && repeat) {
                this.audioPlayer.setCurrentTime(this.audioPlayer.getCurrentTime() + 1);
                this.listEvents.trigger('onFastForward');
            }
        },
        onFastForward(cb, subscriber) {
            this.listEvents.onEventRegister({cb, subscriber}, 'onFastForward');
        },
        rewind({ctrlKey, repeat, shiftKey}={}) {
            if (ctrlKey && repeat || shiftKey && repeat) {
                this.audioPlayer.setCurrentTime(this.audioPlayer.getCurrentTime() - 1);
                this.listEvents.trigger('onRewind');
            }
        },
        onRewind(cb, subscriber) {
            this.listEvents.onEventRegister({cb, subscriber}, 'onRewind');
        },
        _setUpKeyBindings() {
            this.keyCotrols.registerKeyUpAction(this.keyValues.SPACE, this.playPause.bind(this), this);
            this.keyCotrols.registerKeyDownAction(this.keyValues.PLUS, this.volumeUp.bind(this), this);
            this.keyCotrols.registerKeyDownAction(this.keyValues.MINUS, this.volumeDown.bind(this), this);
            this.keyCotrols.registerKeyUpAction(this.keyValues.ArrowRight, this.nextTrack.bind(this), this);
            this.keyCotrols.registerKeyUpAction(this.keyValues.ArrowLeft, this.prevTrack.bind(this), this);
            this.keyCotrols.registerKeyDownAction(this.keyValues.ArrowRight, this.fastFoward.bind(this), this);
            this.keyCotrols.registerKeyDownAction(this.keyValues.ArrowLeft, this.rewind.bind(this), this);
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

    window.JSPlayer.EventsManager = {ListEvents, keyCotrols: new KeyCotrols(), AudioPlayerKeyControls};
})(this, document);