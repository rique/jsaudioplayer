(function(window, document, JSPlayer, undefined) {

    const {HTMLItems} = JSPlayer.HTMLItems;
    const {getPercentageWidthFromMousePosition, whileMousePressedAndMove} = JSPlayer.Utils;
    const {ListEvents} = JSPlayer.EventsManager;
    const {TrackListManager} = JSPlayer.TrackListV2;

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
        
        this.setUp(parentCnt);
    };
    ProgerssBar.prototype = {
        setUp(parentCnt) {
            this.mainDiv.id('progress');
            this.subDiv.id('prog-bar');
            this.mainDiv.append(this.subDiv);
            
            parentCnt.append(this.mainDiv.render());
            const hoverEffect = new HoverEffect(this.mainDiv);
            hoverEffect.setUp();

            whileMousePressedAndMove(this.mainDiv.render(), this.seek.bind(this));
            whileMousePressedAndMove(this.subDiv.render(), this.seek.bind(this));
        },
        seek(evt, mouseDown) {
            percentWidth = getPercentageWidthFromMousePosition(evt.clientX, this.mainDiv);
            this.disableProgress = mouseDown;
            this._updateProgressBar(percentWidth  * 100);
            this.listEvents.trigger('onSeek', percentWidth, mouseDown);
        },
        onSeek(cb, subscriber) {
            this.listEvents.onEventRegister({cb, subscriber}, 'onSeek');
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
    };

    const AudioPlayerProgressBar = function(audioPlayer) {
        this.audioPlayer = audioPlayer;
        this.audioPlayer.onPlayPause(this.togglePauseProgress.bind(this), this);
        this.progressBar = new ProgerssBar(document.getElementById('player'));
        this.progressBar.onSeek(this.seek.bind(this), this);
        this.isPaused = true;
    };
    AudioPlayerProgressBar.prototype = {
        togglePauseProgress(isPaused) {
            this.setPauseState(isPaused);
            if (!isPaused) {
                this.progress();
            }
        },
        progress() {
            if (this.isPaused)
                return;
            
            let currentTime = this.audioPlayer.getCurrentTime(),
                totalTime = this.audioPlayer.getDuration();
            this.progressBar.progress(currentTime, totalTime, this.progress.bind(this));
        },
        seek(percentWidth) {
            const {track} = TrackListManager.getCurrentTrack();
            this.audioPlayer.setCurrentTime(track.trackDuration * percentWidth);
            this.progress();
        },
        setPauseState(isPaused) {
            this.isPaused = isPaused;
        }
    }

    JSPlayer.HTMLItemsComponents = {ProgerssBar, AudioPlayerProgressBar};

})(this, document, this.JSPlayer);