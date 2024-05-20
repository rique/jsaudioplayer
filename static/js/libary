(function(window, document, JSPlayer, undefined) {

    /*const NotificationCenter = JSPlayer.NotificationCenter;

    const {Track, ID3Tags} = JSPlayer.Tracks;
    const {TrackListManager} = JSPlayer.TrackListV2;
    const TracklistGrid = JSPlayer.Grids.TracklistGrid;
    const draw = JSPlayer.Vizualizer.draw;
    const AudioPlayer = JSPlayer.AudioPlayer;
    const keyCotrols = JSPlayer.EventsManager.keyCotrols;
    const Fader = JSPlayer.Effects.Fader;
    const {LeftMenu, FileBrowser, Layout, layoutHTML, FileBrowserRenderer} = JSPlayer.Components;*/


    const Library = function() {
        this.tracks = {};
        this.nbTracks = 0;
    };
    Library.prototype = {
        addTrack({track, trackUUid}) {
            if (this.tracks.hasOwnProperty(trackUUid))
                return console.error(`${trackUUid} for track ${track} already set : ${this.tracks[trackUUid]}`);
            this.tracks[trackUUid] = track;
            ++this.nbTracks;
        },
        getTracks() {
            return this.tracks;
        },
        getTrackByUUID(trackUUid) {
            return this.tracks[trackUUid];
        },
        *getTracksByUUIDList(UUIDList) {
            for (let i = 0; i < UUIDList.length; ++i) {
                const trackUUid = UUIDList[i];
                
                if (!this.tracks.hasOwnProperty(trackUUid)) {
                    continue;
                }
                
                yield this.tracks[trackUUid];
            }
        },
        getNbTracks() {
            return this.nbTracks;
        },
    }

    JSPlayer.Library = {Library};

})(this, document, this.JSPlayer);