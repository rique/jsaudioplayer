(function(window, document, JSPlayer, undefined) {

    const {HTMLItems} = JSPlayer.HTMLItems;
    const {getPercentageWidthFromMousePosition, whileMousePressedAndMove} = JSPlayer.Utils;
    const {ListEvents} = JSPlayer.EventsManager;
    const {TrackListManager} = JSPlayer.Tracks;

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
        progress(current, total, cb) {
            if (current > total || this.disableProgress)
                return false;
            let percentProg = (current / total) * 100;
            this._updateProgressBar(percentProg, cb);
            return true;
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

    const AudioPlayerProgressBar = function(audioPlayer) {
        this.audioPlayer = audioPlayer;
        this.progressBar = new ProgerssBar(document.getElementById('player'));
        this.progressBar.onSeek(this.seek.bind(this), this);
    };
    AudioPlayerProgressBar.prototype = {
        progress() {
            let currentTime = this.audioPlayer.getCurrentTime(),
                totalTime = this.audioPlayer.getDuration();
            this.progressBar.progress(currentTime, totalTime, this.progress.bind(this));
        },
        seek(percentWidth) {
            this.audioPlayer.setCurrentTime(TrackListManager.getCurrentTrack().trackDuration * percentWidth);
            this.progress();
        }
    }

    JSPlayer.HTMLItemsComponents = {ProgerssBar, AudioPlayerProgressBar};

})(this, document, this.JSPlayer);