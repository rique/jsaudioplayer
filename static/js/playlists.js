
(function(window, document, JSPlayer, undefined) {

    const {HTMLItems, EditInput} = JSPlayer.HTMLItems;
    const {TracklistManager, TrackList} =  JSPlayer.TrackListV2;
    const Api = window.JSPlayer.Api;

    const PlaylistCreator = function() {
        this.htmlItem = new HTMLItems('div');
        this.buttonItem = new HTMLItems('button');
        this.inputItem = new EditInput();
        this.api = new Api();
        this.htmlItem.setClassName('playlist-form');
        this.htmlItem.innerContent('<h4>Enter playlist name</h4>');
        this.htmlItem.append(this.inputItem, this.buttonItem);
        this.inputItem.addEventListener('keydown', evt => evt.key === 'Enter' && this._validate(evt));
        this.htmlItem.addEventListener('click', this._validate.bind(this));
        this.buttonItem.innerContent('Save');
        this.overlayDiv = document.querySelector('.cnt-overlay');
        this.overlayDiv.append(this.htmlItem.render());
        this.overlayDiv.addEventListener('click', (evt) => {
            if (evt.target == evt.currentTarget)
                this.hide();
        });
    };
    PlaylistCreator.prototype = {
        show() {
            this.overlayDiv.style.display = 'block';
            this.htmlItem.show();
        },
        hide() {
            this.overlayDiv.style.display = 'none';
            this.htmlItem.hide();
        },
        _validate() {
            const playlistName = this.inputItem.value();
            if (!playlistName || playlistName.trim().length == 0)
                return;
            this.api.createPlaylist(playlistName, [], (res) => {
                console.log({res});
                if (!res.success)
                    return alert('Error while creating playlist');
                this.inputItem.value('');
                this.hide();
                PlaylistManager.createAndAddPlaylist(res['playlist_uuid']);
            });
        }
    }

    const PlaylistManager = {
        playlists: {},
        createPlaylist(playlistUUID) {
            if (this.playlists.hasOwnProperty(playlistUUID)) {
                return console.error(`playlist with id ${playlistUUID} already exists`);
            }
            return new Playlist(playlistUUID);
        },
        addPlaylist(playlist, playlistUUID) {
            if (this.playlists.hasOwnProperty(playlistUUID)) {
                return console.error(`playlist with id ${playlistUUID} already exists`);
            }
            this.playlists[playlistUUID] = playlist;
        },
        createAndAddPlaylist(playlistUUID) {
            const playlist = this.createPlaylist(playlistUUID);
            if (playlist)
                this.playlists[playlistUUID] = playlist;
        },
        getPlaylist(playlistUUID) {
            return this.playlists[playlistUUID];
        },
        setPlaylistTracklist(tracklist, playlistUUID) {
            if (!this.playlists.hasOwnProperty(playlistUUID))
                return console.error(`playlist with id ${playlistUUID} does not exists`);
            this.playlists[playlistUUID].setTracklist(tracklist);
        },
        addTrackToPlaylist(track, playlistUUID) {
            if (!this.playlists.hasOwnProperty(playlistUUID))
                return console.error(`playlist with id ${playlistUUID} does not exists`);
            this.playlists[playlistUUID].addTrack(track);
        },
        setCUrrentPlaylist(playlistUUID) {
            if (!this.playlists.hasOwnProperty(playlistUUID))
                return console.error(`playlist with id ${playlistUUID} does not exists`);
            TracklistManager.setTracklist(this.playlists[playlistUUID].getTracklist());
        }
    }

    const Playlist = function(playlistUUID) {
        this.playlistUUID = playlistUUID;
        this.tracklist = new TrackList();
    }; 
    Playlist.prototype = {
        setTracklist(tracklist) {
            this.tracklist = tracklist;
        },
        getTracklist() {
            return this.tracklist;
        },
        addTrack(track) {
            this.tracklist.addItem(track);
        }
    };

    window.JSPlayer.Playlists = {
        PlaylistCreator,
        PlaylistManager,
        Playlist
    }

})(this, document, this.JSPlayer);