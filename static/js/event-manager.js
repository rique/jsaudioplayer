(function(window, document, undefined) {

    window.JSPlayer = window.JSPlayer || {};

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

    window.JSPlayer.ListEvents = ListEvents;

})(this, document);