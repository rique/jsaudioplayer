(function(window, document, JSPlayer, undefined) {

    const NotificationCenter = JSPlayer.NotificationCenter;
    const {HTMLItems} = JSPlayer.HTMLItems;
    const {ListEvents} = JSPlayer.EventsManager;

    const PlayerButtonBaseItem = function() {
        this.listEvents = new ListEvents();
        this.setUpItem();
    };
    PlayerButtonBaseItem.prototype = {
        setUpItem() {
            this.htmlItem.setClassName('inline-block action-cnt');
        },
        onSwitchState(cb, subscriber) {
            this.listEvents.onEventRegister({cb, subscriber}, 'onSwitchState');
        },
        onClick(cb) {
            this.htmlItem.addEventListener('click', (evt) => {
                evt.preventDefault();
                cb();
            });
        }
    }

    const PlayPauseButtonItem = function() {
        this.htmlItem = new HTMLItems('div');
        this.playInnerContent = `
        <span>
            <a href="" class="player-action">
                <i class="fa-solid fa-play"></i>
            </a>
        </span>`;

        this.pauseInnerContent = `
        <span>
            <a href="" class="player-action">
                <i class="fa-solid fa-pause"></i>
            </a>
        </span>`;
        PlayerButtonBaseItem.call(this);
    };
    PlayPauseButtonItem.prototype = {
        setUpItem() {
            this.htmlItem.id('play-button');
            this.setInnerContent(true);
            PlayerButtonBaseItem.prototype.setUpItem.call(this);
        },
        render() {
            return this.htmlItem.render();
        },
        switchState(isPaused) {
            this.setInnerContent(isPaused);
            this.listEvents.trigger('onSwitchState', isPaused);
        },
        setInnerContent(isPaused) {
            if (isPaused) {
                this.htmlItem.innerContent(this.playInnerContent);
            } else {
                this.htmlItem.innerContent(this.pauseInnerContent);
            }

        }
    };

    const StopButtonItem = function() {
        this.htmlItem = new HTMLItems('div');
        this.stopContent = `
        <span>
            <a href="" class="player-action">
                <i class="fa-solid fa-stop"></i>
            </a>
        </span>`;

        PlayerButtonBaseItem.call(this);
    };
    StopButtonItem.prototype = {
        setUpItem() {
            this.htmlItem.id('stop-button');
            this.htmlItem.innerContent(this.stopContent);
            PlayerButtonBaseItem.prototype.setUpItem.call(this);
        },
        render() {
            return this.htmlItem.render();
        },
        switchState(evt) {
            this.listEvents.trigger('onSwitchState', evt);
        }
    }

    const PrevButtonItem = function() {
        this.htmlItem = new HTMLItems('div');
        this.prevContent = `
        <span>
            <a href="" class="player-action">
                <i class="fa-solid fa-backward-step"></i>
            </a>
        </span>`;

        PlayerButtonBaseItem.call(this);
    };
    PrevButtonItem.prototype = {
        setUpItem() {
            this.htmlItem.id('prev-button');
            this.htmlItem.innerContent(this.prevContent);
            PlayerButtonBaseItem.prototype.setUpItem.call(this);
        },
        render() {
            return this.htmlItem.render();
        },
        switchState(evt) {
            this.listEvents.trigger('onSwitchState', evt);
        }
    }

    const NextButtonItem = function() {
        this.htmlItem = new HTMLItems('div');
        this.nextContent = `
        <span>
            <a href="" class="player-action">
                <i class="fa-solid fa-forward-step"></i>
            </a>
        </span>`;

        PlayerButtonBaseItem.call(this);
    };
    NextButtonItem.prototype = {
        setUpItem() {
            this.htmlItem.id('next-button');
            this.htmlItem.innerContent(this.nextContent);
            PlayerButtonBaseItem.prototype.setUpItem.call(this);
        },
        render() {
            return this.htmlItem.render();
        },
        switchState(evt) {
            this.listEvents.trigger('onSwitchState', evt);
        }
    }

    const ShuffleButtonItem = function() {
        this.htmlItem = new HTMLItems('div');
        // 0 -> off; 1 -> on
        this.btnState = 0;
        this.shuffleContent = `
        <span>
            <a href="" class="player-action">
                <i class="fa-solid fa-shuffle"></i>
            </a>
        </span>`;

        PlayerButtonBaseItem.call(this);
    };
    ShuffleButtonItem.prototype = {
        setUpItem() {
            this.htmlItem.id('shuffle-button');
            this.htmlItem.innerContent(this.shuffleContent);
            PlayerButtonBaseItem.prototype.setUpItem.call(this);
        },
        render() {
            return this.htmlItem.render();
        },
        switchState(evt) {
            ++this.btnState;
            
            if (this.btnState > 1)
                this.btnState = 0;

            this.setBtnStyle();
            this.listEvents.trigger('onSwitchState', evt);
        },
        setBtnStyle() {
            if (this.btnState == 0) {
                this.htmlItem.classRemove('repeat-active');
            } else {
                this.htmlItem.classAdd('repeat-active');
            }
        }
    };

    const RepeatButtonItem = function() {
        this.htmlItem = new HTMLItems('div');
        // 0 -> off; 1 -> repeat; 2 -> repeat 1
        this.btnState = 0;
        this.repeatInnerContent = `
        <span>
            <a href="" class="player-action">
                <i class="fa-solid fa-repeat"></i>
                <div class="repeat-one">1</div>
            </a>
        </span>`;

        this.repeatOneInnerContent = `
        <span>
            <a href="" class="player-action">
                <i class="fa-solid fa-repeat"></i>
                <div class="repeat-one repeat-active">1</div>
            </a>
        </span>`;

        PlayerButtonBaseItem.call(this);
    };
    RepeatButtonItem.prototype = {
        setUpItem() {
            this.htmlItem.id('play-button');
            this.setInnerContent();
            PlayerButtonBaseItem.prototype.setUpItem.call(this);
        },
        render() {
            return this.htmlItem.render();
        },
        switchState(repeatMode) {
            this.btnState = repeatMode;
            this.setInnerContent();
            this.listEvents.trigger('onSwitchState', repeatMode);
        },
        setInnerContent() {
            if (this.btnState == 0) {
                this.htmlItem.classRemove('repeat-active');
                this.htmlItem.innerContent(this.repeatInnerContent);
            } else if (this.btnState == 1) {
                this.htmlItem.classAdd('repeat-active');
                this.htmlItem.innerContent(this.repeatInnerContent);
            } else if (this.btnState == 2) {
                this.htmlItem.classAdd('repeat-active');
                this.htmlItem.innerContent(this.repeatOneInnerContent);
            }
        }
    };

    Object.setPrototypeOf(PlayPauseButtonItem.prototype, PlayerButtonBaseItem.prototype);
    Object.setPrototypeOf(StopButtonItem.prototype, PlayerButtonBaseItem.prototype);
    Object.setPrototypeOf(PrevButtonItem.prototype, PlayerButtonBaseItem.prototype);
    Object.setPrototypeOf(NextButtonItem.prototype, PlayerButtonBaseItem.prototype);
    Object.setPrototypeOf(ShuffleButtonItem.prototype, PlayerButtonBaseItem.prototype);
    Object.setPrototypeOf(RepeatButtonItem.prototype, PlayerButtonBaseItem.prototype);
    
    const PlayerButtons = function(parentCnt, playerControls) {
        this.parentCnt = parentCnt;
        this.playerControls = playerControls;
        this.playPauseBtn = new PlayPauseButtonItem();
        this.stopBtn = new StopButtonItem();
        this.prevBtn = new PrevButtonItem();
        this.nextBtn = new NextButtonItem();
        this.shuffleBtn = new ShuffleButtonItem();
        this.repeatBtn = new RepeatButtonItem();

        this._setUp();
    };
    PlayerButtons.prototype = {

        _setUp() {
            this.parentCnt.append(
                this.playPauseBtn.render(), 
                this.stopBtn.render(), 
                this.prevBtn.render(),
                this.nextBtn.render(),
                this.shuffleBtn.render(),
                this.repeatBtn.render()
            );

            this.playPauseBtn.onClick(this.playerControls.playPause.bind(this.playerControls));
            this.stopBtn.onClick(this.playerControls.stop.bind(this.playerControls));
            this.prevBtn.onClick(this.playerControls.prev.bind(this.playerControls));
            this.nextBtn.onClick(this.playerControls.next.bind(this.playerControls));
            this.shuffleBtn.onClick(this.playerControls.shuffle.bind(this.playerControls));
            this.repeatBtn.onClick(this.playerControls.repeat.bind(this.playerControls));

            this.playerControls.onPlayPause(this.playPause.bind(this));
            this.playerControls.onStop(this.stop.bind(this));
            this.playerControls.onPrevTrack(this.prev.bind(this));
            this.playerControls.onNextTrack(this.next.bind(this));
            this.playerControls.onShuffle(this.shuffle.bind(this));
            this.playerControls.onRepeat(this.repeat.bind(this));
        },
        playPause(isPaused) {
            this.playPauseBtn.switchState(isPaused);
        },
        stop() {
            this.stopBtn.switchState();
        },
        prev() {
            this.prevBtn.switchState();
        },
        next() {
            this.nextBtn.switchState();
        },
        shuffle() {
            this.shuffleBtn.switchState();
        },
        repeat(repeatMode) {
            this.repeatBtn.switchState(repeatMode);
        }
    }

    const PlayerControls = function(audioPlayer) {
        this.listEvents = new ListEvents();
        this.audioPlayer = audioPlayer;
        this.audioPlayer.onPlayPause((isPaysed) => {
            this.listEvents.trigger('onPlayPause', isPaysed);
        }, this);
    }
    PlayerControls.prototype = {
        setAudioPlayer(audioPlayer) {
            this.audioPlayer = audioPlayer;
        },
        playPause() {
            this.audioPlayer.playPause();
        },
        stop() {
            this.audioPlayer.stop();
            this.listEvents.trigger('onStop');
        },
        prev() {
            this.audioPlayer.prev();
            this.listEvents.trigger('onPrevTrack');
        },
        next() {
            this.audioPlayer.next();
            this.listEvents.trigger('onNextTrack');
        },
        shuffle() {
            this.audioPlayer.shuffle();
            this.listEvents.trigger('onShuffle');
        },
        repeat() {
            const repeatMode = this.audioPlayer.repeat();
            this.listEvents.trigger('onRepeat', repeatMode);
        },
        rewind() {
            this.audioPlayer.setCurrentTime(this.audioPlayer.getCurrentTime() - 1);
            this.listEvents.trigger('onRewind');
        },
        fastForward() {
            this.audioPlayer.setCurrentTime(this.audioPlayer.getCurrentTime() + 1);
            this.listEvents.trigger('onFastForward');
        },
        increasVolume() {
            this.audioPlayer.increasVolume();
        },
        decreasVolume() {
            this.audioPlayer.decreasVolume();
        },
        onPlayPause(cb, subscriber) {
            this.listEvents.onEventRegister({cb, subscriber}, 'onPlayPause');
        },
        onStop(cb, subscriber) {
            this.listEvents.onEventRegister({cb, subscriber}, 'onStop');
        },
        onNextTrack(cb, subscriber) {
            this.listEvents.onEventRegister({cb, subscriber}, 'onNextTrack');
        },
        onPrevTrack(cb, subscriber) {
            this.listEvents.onEventRegister({cb, subscriber}, 'onPrevTrack');
        },
        onShuffle(cb, subscriber) {
            this.listEvents.onEventRegister({cb, subscriber}, 'onShuffle');
        },
        onRepeat(cb, subscriber) {
            this.listEvents.onEventRegister({cb, subscriber}, 'onRepeat');
        },
        onRewind(cb, subscriber) {
            this.listEvents.onEventRegister({cb, subscriber}, 'onRewind');
        },
        onFastForward(cb, subscriber) {
            this.listEvents.onEventRegister({cb, subscriber}, 'onFastForward');
        }
    }

    JSPlayer.PlayerControls = {PlayerButtons, PlayerControls};

})(this, document, this.JSPlayer);