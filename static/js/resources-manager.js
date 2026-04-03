const ResourceManager = {
    _defaultAlbumArt: '/static/images/albumart.svg',
    _baseMediaTrackURL: '/static/tracks/',
    _baseAlbumArtURL: '/api/track-art/',
    _knownMissingArt: new Set(),

    getDefaultAlbumArt() {
        return this._defaultAlbumArt;
    },

    getMediaAudioURL(trackUUID) {
        if (!trackUUID) return null;
        return this._baseMediaTrackURL + trackUUID + '.mp3';
    },

    getAlbumArtURL(track) {
        if (track?.has_art === false) {
            return this.getDefaultAlbumArt(); // Zero network latency
        }
        console.log('ResourceManager.getAlbumArtURL called with track', {track});
        return `${this._baseAlbumArtURL}${track.getTrackUUID()}/`;
    },

    markAsMissing(trackUUID) {
        this._knownMissingArt.add(trackUUID);
    },

    preloadAlbumArt(track) {
        const img = new Image();
        img.src = this.getAlbumArtURL(track);
        img.onerror = () => {
            console.warn(`Failed to preload album art for track ${track.getTrackUUID()}, using default art.`);
            img.src = this.getDefaultAlbumArt();
        }
    },
}

export { ResourceManager };