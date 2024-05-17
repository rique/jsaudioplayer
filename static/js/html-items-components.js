(function(window, document, JSPlayer, undefined) {

    const {HTMLItems} = JSPlayer.HTMLItems;
    const {getPercentageWidthFromMousePosition, whileMousePressedAndMove} = JSPlayer.Utils;
    const {ListEvents} = JSPlayer.EventsManager;

    const HoverEffect = function(htmlItem) {
        this.htmlItem = htmlItem;
    };
    HoverEffect.prototype = {
        setUp() {
            this.htmlItem.addEventListener('mouseenter', (evt) => {
                const percentWidth = (getPercentageWidthFromMousePosition(evt.clientX, this.htmlItem) * 100).toFixed(2);
                this.htmlItem.css({background: `linear-gradient(90deg, rgba(255, 124, 120, 0.6) ${percentWidth}%, #292929 0%)`});
            });
    
            this.htmlItem.addEventListener('mousemove', (evt) => {
                const percentWidth = (getPercentageWidthFromMousePosition(evt.clientX, this.htmlItem) * 100).toFixed(2);
                this.htmlItem.css({background: `linear-gradient(90deg, rgba(255, 124, 120, 0.6) ${percentWidth}%, #292929 0%)`});
            });
    
            this.htmlItem.addEventListener('mouseleave', () => {
                this.htmlItem.css({background: "#181717"});
            });
        }
    }

    const ProgerssBar = function(parentCnt) {
        this.listEvents = new ListEvents();
        this.mainDiv = new HTMLItems('div');
        this.subDiv = new HTMLItems('div');
        
        this.mainDiv.append(this.subDiv);
        parentCnt.append(this.mainDiv.render());
        
        whileMousePressedAndMove(this.mainDiv.render(), this.seek.bind(this));
        whileMousePressedAndMove(this.subDiv.render(), this.seek.bind(this));

        this.setUp();
    };
    ProgerssBar.prototype = {
        setUp() {
            this.mainDiv.id('progress');
            this.subDiv.id('prog-bar');
            const hoverEffect = new HoverEffect(this.mainDiv);
            hoverEffect.setUp();
        },
        progress(current, total) {
            if (current > total || this.disableProgress)
                return;
            let percentProg = (current / total) * 100;
            this._updateProgressBar(percentProg);
            
        },
        _updateProgressBar(progress, cb) {
            requestAnimationFrame(() => {
                if (progress > 100)
                    progress = 100;
                this.subDiv.width(progress, '%');
                if (typeof cb === 'function')
                    cb();
            });
        },
        seek(evt, mouseDown) {
            percentWidth = getPercentageWidthFromMousePosition(evt.clientX, this.mainDiv);
            this.disableProgress = mouseDown;
            this._updateProgressBar(percentWidth  * 100);
            this.listEvents.trigger('onSeek', percentWidth, mouseDown);
        },
        onSeek(cb, subscriber) {
            this.listEvents.onEventRegister({cb, subscriber}, 'onSeek');
        }
    };

    JSPlayer.HTMLItemsComponents = {ProgerssBar};

})(this, document, this.JSPlayer);