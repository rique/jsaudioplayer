(function(window, document, JSPlayer, undefined) {
    const api = new JSPlayer.Api;

    const BasLoader = function() {
        this.map = {};
    };
    BasLoader.prototype = {
        async getByIdAsync(id) {
            if (!this.map.hasOwnProperty(id)) {
                this.map[id] = await this.loadAsync(id);
            }

            return this.map[id].object;
        },
        getById(id, cb) {
            if (!this.map.hasOwnProperty(id)) {
                return this.load(id, cb);
            }

            return cb(this.map[id]);
        }
    }

    const AlbumArtLoader = function() {
        BasLoader.call(this);
    };
    AlbumArtLoader.prototype = {
        async loadAsync(track_uuid) {
            const res = await api.loadTrackAlbumArtAsync(track_uuid);
            if (res.success) {
                return {object: {id3: res.ID3}, loaded: true};
            }
            return {object: false, loaded: false};
        },
        load(track_uuid, cb) {
            api.loadTrackAlbumArt(track_uuid, (res) => {
                if (res.success) {
                    this.map[track_uuid] = {object: res.ID3, loaded: true};
                }
                this.map[track_uuid] = {object: false, loaded: false};
                if (typeof cb === 'function')
                    cb(this.map[track_uuid]);
            });
        }
    };

    const TrackInfoLoader = function() {
        BasLoader.call(this);
    };
    TrackInfoLoader.prototype = {
        async loadAsync(track_uuid) {
            const res = await api.loadTrackInfoAsync(track_uuid);
            if (res.success) {
                return {object: {id3: res.ID3}, loaded: true};
            }
            return {object: false, loaded: false};
        },
        load(track_uuid, cb) {
            api.loadTrackInfo(track_uuid, (res) => {
                if (res.success) {
                    this.map[track_uuid] = {object: res.ID3, loaded: true};
                }
                this.map[track_uuid] = {object: false, loaded: false};
                if (typeof cb === 'function')
                    cb(this.map[track_uuid]);
            });
        }
    };

    Object.setPrototypeOf(AlbumArtLoader.prototype, BasLoader.prototype);
    Object.setPrototypeOf(TrackInfoLoader.prototype, BasLoader.prototype);

    window.JSPlayer.Loaders = {AlbumArtLoader, TrackInfoLoader};

})(this, document, this.JSPlayer);