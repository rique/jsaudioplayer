import { TrackListManager } from "./tracklistv2.js";
import { ResourceManager } from "./resources-manager.js";

const PlaybackMediator  = {
    init(tracklistBrowser, mainGrid, queueGrid, audioPlayer) {
        this.browser = tracklistBrowser;
        this.mainGrid = mainGrid;
        this.queueGrid = queueGrid;
        this.audioPlayer = audioPlayer;

        TrackListManager.onTrackChanged(this.handleTrackChange.bind(this), this);
        TrackListManager.onGridSyncRequired(this.handleTrackChange.bind(this), this);
        TrackListManager.onShuffleTracklist((track, index, isShuffle) => {
            this.mainGrid.redrawGrid();
            this.handleTrackChange(track, index, false);
            if (this.audioPlayer.isPlayerPaused()) {
                this.audioPlayer.setCurrentTrackFromTrackList(true, undefined, {track, index});
            }
        });
    },
    async handleTrackChange(track, index, isQueue) {
        console.log('TrackListMediator: Track changed', {track, index, isQueue});
        // Determine the correct Grid Context
        if (isQueue) {
            // The Mediator tells the QueueGrid to prepare itself
            // It passes the track and the length pulled from the Manager
            this.queueGrid.syncQueue(TrackListManager.queueList.length());
            this.browser.setGrid(this.queueGrid);
        } else {
            this.queueGrid.deactivate();
            this.browser.setGrid(this.mainGrid);
        }

        // Finally, highlight the row
        this.browser.setCurrentlyPlayingTrack(index);
    }
};

const PlayerControlMediator = {
    init(player, playerDisplay, progresbar, notifications) {
        this.player = player;
        this.playerDisplay = playerDisplay;
        this.progressBar = progresbar;
        this.notifications = notifications;

        this._bindPlayerEvents();
    },
    _bindPlayerEvents() {
        // 1. When a song starts playing
        this.player.onPlayerSongChange((track, index) => {
            console.log('PlayerControlMediator: Player song change event', {track, index});
            this.playerDisplay.setTrack(track);

            const nextTrack = TrackListManager.peekNext();
            if (nextTrack) ResourceManager.preloadAlbumArt(nextTrack);

            this._updateSystemMetadata(track);
        });
        // 2. On player time update
        this.player.audioElem.ontimeupdate = (current, total) => {
            this.progressBar.progress(current, total);
        };
    },
    _updateSystemMetadata(track) {
        if (!('mediaSession' in navigator)) return;

        const artUrl = ResourceManager.getAlbumArtURL(track);

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.getTitle(),
            artist: track.getArtist(),
            album: track.getAlbum(),
            artwork: [{ src: artUrl }]
        });
    }
}

export { PlaybackMediator, PlayerControlMediator };