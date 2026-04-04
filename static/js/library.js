import {Playlist} from './playlists.js';
import { Track, ID3Tags } from './tracks.js';

const Library = function() {
    this.tracks = {};
    this.nbTracks = 0;
    this.playlist = new Playlist('library');
};
Library.prototype = {
    async bootstrap(tracklist) {
        console.log('bootstrap library', {tracklist});
        for (let i in tracklist) {
            let trackInfo = tracklist[i];
            let track = new Track(trackInfo['track']),
                id3Tags = new ID3Tags(trackInfo['ID3']);
    
            track.setID3Tags(id3Tags);
            track.setTrackDuration(id3Tags.getDuration());
            track.setIndex(i);
            this.addTrack({track, trackUUid: trackInfo.track['track_uuid']});
        }
    },
    addTrack({track, trackUUid}) {
        if (this.tracks.hasOwnProperty(trackUUid))
            return console.error(`track UUID '${trackUUid}' provided for track ${track} is already set for : ${this.tracks[trackUUid]}`);
        this.tracks[trackUUid] = track;
        ++this.nbTracks;
        this.playlist.addTrack(track);
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
    getPlaylist() {
        return this.playlist;
    }
}

const library = new Library();

export default library;
