import { TrackListManager } from "./tracklistv2.js";
import { ResourceManager } from "./resources-manager.js";

const PlaybackMediator  = {
    init(tracklistBrowser, mainGrid, queueGrid, audioPlayer) {
        this.browser = tracklistBrowser;
        this.mainGrid = mainGrid;
        this.queueGrid = queueGrid;
        this.audioPlayer = audioPlayer;
        this._comingNextFired = false;

        TrackListManager.onQueueFinished(this.handleQueueEnd.bind(this));
        TrackListManager.onTrackListLoaded(this._initializeMainGrid.bind(this), this);
        TrackListManager.onTrackChanged((track, index, isQueue, hasQueue) => {
            console.log('onTrackChanged');
            this.handleTrackChange.bind(this)(track, index, isQueue, hasQueue);
        }, this);
        TrackListManager.onGridSyncRequired((track, index, isQueue, hasQueue) => {
            console.log('onGridSyncRequired');
            this.handleTrackChange.bind(this)(track, index, isQueue, hasQueue)
        }, this);
        TrackListManager.onShuffleTracklist((track, index, isShuffle) => {
            this.mainGrid.redrawGrid();
            this.handleTrackChange(track, index, false, false);
            if (this.audioPlayer.isPlayerPaused()) {
                this.audioPlayer.setCurrentTrackFromTrackList(true, undefined, {track, index});
            }
        });
    },
    async handleTrackChange(track, index, isQueue, hasQueue) {
        console.log('TrackListMediator: Track changed', {track, index, isQueue, hasQueue});
        // Determine the correct Grid Context
        if (isQueue) {
            // The Mediator tells the QueueGrid to prepare itself
            // It passes the track and the length pulled from the Manager
            this.queueGrid.syncQueue(TrackListManager.queueList.length());
            this.browser.setGrid(this.queueGrid);
            
        } else {
            if (!hasQueue)
                this.queueGrid.deactivate();
            this.browser.setGrid(this.mainGrid);
        }

        // Finally, highlight the row
        this.browser.setCurrentlyPlayingTrack(index);
    },
    handleQueueEnd() {
        console.log('PlaybackMediator: Queue finished. Resetting UI anchor.');
        // Tell the grid to release its "Sticky" anchor and re-sync
        this.mainGrid.releaseQueueAnchor();
    },
    _initializeMainGrid() {
        this.mainGrid.setUp();
        this.mainGrid.buildGrid();
        this.mainGrid.render();
    }
};

const PlayerControlMediator = {
    init(
        player, 
        playerDisplay, 
        playerProgressBar, 
        notifications, 
        playerControls, 
        keyControls,
        uiModules
    ) {
        this.player = player;
        this.playerDisplay = playerDisplay;
        this.playerProgressBar = playerProgressBar;
        this.notifications = notifications;
        this.playerControls = playerControls;
        this.keyControls = keyControls;
        this.uiModules = uiModules;

        this._comingNextFired = false;

        this._bindCoreEvents();
        this._bindUIEvents();
        this._bindKeyboardEvents();
        this._bindPlayerUIEvents();
        this._bindSystemEvents();
    },
    _bindCoreEvents() {
        // 1. When a song starts playing
        this.player.onPlayerSongChange((track, index) => {
            this.playerDisplay.setTrack(track);
            this.playerProgressBar.resetProgresBar();

            if (this._comingNextFired === true)
                this.notifications.hideComingNext();

            this._preloadNextTrackArt();
            this._comingNextFired = false;
            this._updateSystemMetadata(track);
        }, this);
        // 2. On player time update
        this.player.audioElem.ontimeupdate = (evt) => {
            const currentTime = evt.target.currentTime;
            const duration = evt.target.duration;

            if (isNaN(duration) || isNaN(currentTime) || duration === 0)
                return;

            if (this.player.currentTrack)
                this.player.currentTrack.setCurrentTime(currentTime);

            let nextTrack;
            
            if ((duration - currentTime <= 30) && !this._comingNextFired) {
                this._comingNextFired = true;
                if (this.player.getRepeatMode() == 2)
                    nextTrack = {track: this.player.currentTrack};
                else
                    nextTrack = TrackListManager.getNextTrackInList();
                
                if (!nextTrack || !nextTrack.track) return;

                const remainingTime = (duration - currentTime) * 1000;
                this.notifications.setComingNext(nextTrack.track, remainingTime);
            }
        };

        TrackListManager.onAddedToQueue((track) => {
            if (this._comingNextFired === true) {
                this.notifications.hideComingNext();
                this._comingNextFired = false;
            }
        }, this);
    },
    _bindUIEvents() {
        this._setAudioElementEvents();

        this.overlayDiv = document.querySelector('.cnt-overlay');

        this.overlayDiv.addEventListener('click', (evt) => {
            if (evt.target === evt.currentTarget) {
                this._closeAllActiveWindows(evt);
            }
        });

        // Handle left menu buttons
        this.fileBrowserElem = document.querySelector('#file-browser-action button.open-file-browser');
        this.gridElement = document.querySelector('#file-browser-action button.open-tracklist-browser');
        this.playlistCreationElement = document.querySelector('#file-browser-action button.open-playlist-create');
        
        this.fileBrowserElem.addEventListener('click', (evt) => {
            this._showBackDrop();
            this.uiModules.fileBrowser.loadFileBrowser.bind(this.uiModules.fileBrowser)(evt);
        });

        this.gridElement.addEventListener('click', (evt) => {
            this._showBackDrop();
            this.uiModules.tracklistGrid.open(evt);
        });

        this.playlistCreationElement.addEventListener('click', this._displayPlaylistCreationUI.bind(this));

        this.player.onPlayPause((isPaused, currentTrack) => {
            this.playerProgressBar.togglePauseProgress.call(this.playerProgressBar, isPaused);
            this._updateSystemMetadata(currentTrack);
        }, this);
        
        this.player.onStop(this.playerProgressBar.resetProgresBar.bind(this.playerProgressBar));
        
        this.playerControls.onPrevTrack(() => {
            this.notifications.hideComingNext();
            this._comingNextFired = false;
        }, this);
        
        this.playerProgressBar.progressBar.onSeek((percent, mouseDown) => {
            this.playerProgressBar.seek(percent, mouseDown);
        }, this);
        
        this.playerControls.onRepeat((repeatMode) => {
            this._preloadNextTrackArt();
        }, this);
    },
    _bindKeyboardEvents() {
        this.keyControls.registerKeyDownAction('m', () => {
            this.player.mute();
            this.playerDisplay.showMuteOverlay(this.player.isMuted());
        }, this);
        
        ['+', '-'].forEach(key => {
            this.keyControls.registerKeyDownAction(key, () => {
                // When key is held down, just show/reset the UI
                this.playerDisplay.showVolumeOverlay(this.player.getVolume());
            }, this);

            this.keyControls.registerKeyUpAction(key, () => {
                // When key is released, start the fade out
                this.playerDisplay.hideVolumeOverlay();
            }, this);
        });

        const {tracklistGrid, playlistCreation} = this.uiModules;
        
        this.keyControls.registerKeyDownAction('a', () => {
            this._showBackDrop();
            tracklistGrid.open();
        }, tracklistGrid);
        this.keyControls.registerKeyDownAction('n', this._displayPlaylistCreationUI.bind(this), playlistCreation);
        this.keyControls.registerKeyDownAction('Escape', (evt) => {
            this._hideBackDrop();
            this._closeAllActiveWindows(evt.evt);
        }, 'BYPASS_EXCLUSIVITY');
        
    },
    _bindPlayerUIEvents() {
        this.player.onVolumeChange(this.playerDisplay.updateDisplayedVolume.bind(this.playerDisplay));
        this.player.onRepeatSwitch((repeatMode) => {
            TrackListManager.switchRepeatMode(repeatMode);
            this._preloadNextTrackArt();
        }, TrackListManager);
    },
    _setAudioElementEvents() {
        this.player.audioElem.onloadedmetadata = () => {
            this.playerProgressBar.doProgress(this.player.getCurrentTime(), this.player.getDuration());
        };
    },
    _displayPlaylistCreationUI(evt) { 
        console.log('Displaying playlist creation UI', {evt});
        if (evt instanceof Event)
            evt.stopPropagation();

        const {playlistCreation} = this.uiModules;
        this._showBackDrop();
        // this.uiModules.playlistCreation.show.bind(this.uiModules.playlistCreation)(evt);
        const modalElement = playlistCreation.getHTMLItem().render();
        modalElement.onclick = (evt) => evt.stopPropagation();
        this.overlayDiv.append(modalElement);
        playlistCreation.setVisible(true);
        playlistCreation.show(evt);
        this.keyControls.setExclusivityCallerKeyUpV2(playlistCreation);
        this.keyControls.setExclusivityCallerKeyDownV2(playlistCreation);
    },
    /**
     * SECTION 3: EXTERNAL HANDSHAKES
     * Handles Windows/OS Media Session.
     */
    _bindSystemEvents() {
        if (!('mediaSession' in navigator)) return;

        // Action Handlers (When user hits physical Media Keys on keyboard)
        const actions = [
            ['play', () => this.player.playPause()],
            ['pause', () => this.player.playPause()],
            ['previoustrack', () => this.player.prev()],
            ['nexttrack', () => this.player.next()],
            ['stop', () => this.player.stop()]
        ];

        actions.forEach(([action, handler]) => {
            try { navigator.mediaSession.setActionHandler(action, handler); } catch(e) { console.warn(`Media Session Action ${action} not supported: ${e.message}`); }
        });
    },
    _showBackDrop() {
        this.overlayDiv.style.display = 'block';
    },
    _hideBackDrop() {
        this.overlayDiv.style.display = 'none';
    },
    _updateSystemMetadata(track) {
        document.title = `${track.getTitle()} - ${track.getArtist()}`;
        if (!('mediaSession' in navigator)) return;

        const artUrl = ResourceManager.getAlbumArtURL(track);

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.getTitle(),
            artist: track.getArtist(),
            album: track.getAlbum(),
            artwork: [{ src: artUrl }]
        });
    },
    _preloadNextTrackArt() {
        const nextTrack = TrackListManager.getNextTrackInList();
        console.log('PlayerControlMediator: Next track to play', {nextTrack});
        if (nextTrack && nextTrack.track) ResourceManager.preloadAlbumArt(nextTrack.track);
    },
    _closeAllActiveWindows(evt) {
        this._hideBackDrop();

        Object.values(this.uiModules).forEach(m => m.close?.(evt) || m.hide?.(evt) || m.setVisible?.(false));

        this.keyControls.unsetExclusivityCallerKeyUpV2(this.uiModules.playlistCreation);
        this.keyControls.unsetExclusivityCallerKeyDownV2(this.uiModules.playlistCreation);
    }
}

export { PlaybackMediator, PlayerControlMediator };