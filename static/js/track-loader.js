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

            return this.map[id];
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
            const res = await api.loadTrackAlbumartAsync(track_uuid);
            if (res.success) {
                return {object: res.ID3.picture, loaded: true};
            }
            return {object: {data: '', format: ''}, loaded: false};
        },
        load(track_uuid, cb) {
            api.loadTrackAlbumart(track_uuid, (res) => {
                if (res.success) {
                    this.map[track_uuid] = {object: res.ID3.picture, loaded: true};
                }
                this.map[track_uuid] = {object: {data: '', format: ''}, loaded: false};
                if (typeof cb === 'function')
                    cb(this.map[track_uuid]);
            });
        }
    };

    Object.setPrototypeOf(AlbumArtLoader.prototype, BasLoader.prototype);

    window.JSPlayer.Loaders = {AlbumArtLoader};

})(this, document, this.JSPlayer);