import { TrackListManager } from "./tracklistv2.js";

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

export { PlaybackMediator };