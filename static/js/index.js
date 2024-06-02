(function(window, document, JSPlayer, undefined) {

    const NotificationCenter = JSPlayer.NotificationCenter;

    const {Track, ID3Tags} = JSPlayer.Tracks;
    const {TrackListManager} = JSPlayer.TrackListV2;
    const TracklistGrid = JSPlayer.Grids.TracklistGrid;
    const draw = JSPlayer.Vizualizer.draw;
    const {AudioPlayer, AudioPlayerDisplay} = JSPlayer.AudioPlayer;
    const {keyCotrols, AudioPlayerKeyControls} = JSPlayer.EventsManager;
    const Fader = JSPlayer.Effects.Fader;
    const {LeftMenu, FileBrowser, Layout, layoutHTML, FileBrowserRenderer} = JSPlayer.Components;
    const {AudioPlayerProgressBar} = JSPlayer.HTMLItemsComponents;
    const {PlayerControls, PlayerButtons} = JSPlayer.PlayerControls
    const {TrackListBrowser} = JSPlayer.Components;
    const {PlaylistCreator} = JSPlayer.Playlists;
    const {Library} = JSPlayer.Library;
    const imgList = [];
    const audioPlayerProgressBar = new AudioPlayerProgressBar();
    const audioPlayer = new AudioPlayer(audioPlayerProgressBar);
    const audioPlayerDisplay = new AudioPlayerDisplay(audioPlayer);
    audioPlayerProgressBar.setAudioPlayer(audioPlayer);

    const library = new Library();
    const playerControls = new PlayerControls(audioPlayer);
    const playerButtons = new PlayerButtons(document.getElementById('player-controls'), playerControls);
    const api = new JSPlayer.Api();
    const audioPlayerKeyControls = new AudioPlayerKeyControls(keyCotrols);

    audioPlayerKeyControls.setPlayerControls(playerControls);
    audioPlayerKeyControls.onFastForward(audioPlayerProgressBar.updateProgress.bind(audioPlayerProgressBar), audioPlayerProgressBar);
    audioPlayerKeyControls.onRewind(audioPlayerProgressBar.updateProgress.bind(audioPlayerProgressBar), audioPlayerProgressBar);

    const trackListBrowser = new TrackListBrowser(audioPlayer, audioPlayerDisplay);
    const tracklistGrid = new TracklistGrid('#table-content', audioPlayer, trackListBrowser);
    trackListBrowser.setGrid(tracklistGrid);

    const leftMenu = new LeftMenu();
    leftMenu.init();

    const playlistCreation = new PlaylistCreator();

    NotificationCenter.registerNotification({
        title: 'Tracks Loaded!!',
        level: 'info'
    }, 'tracks.loaded');

    api.loadBGImages((res) => {
        imgList.push(...res['img_list']);
        draw(audioPlayer, imgList);
    });

    api.loadTrackList((res) => {
        audioPlayer.init();
        
        for (let i in res['tracklist']) {
            let trackInfo = res['tracklist'][i];
            let track = new Track(trackInfo['track']),
                id3Tags = new ID3Tags(trackInfo['ID3']);

            track.setID3Tags(id3Tags);
            track.setTrackDuration(id3Tags.getDuration());
            track.setIndex(i);
            library.addTrack({track, trackUUid: trackInfo.track['track_uuid']});
        }
        
        TrackListManager.setPlaylist(library.getPlaylist());
        tracklistGrid.setUp();
        tracklistGrid.buildGrid();
        tracklistGrid.render();
        audioPlayer.setCurrentTrackFromTrackList(false);
        
        NotificationCenter.modifyNotification({
            message: `<p>${TrackListManager.getTracksNumber()} tracks have been loaded!!<p>`
        }, 'tracks.loaded');
        NotificationCenter.displayNotification('tracks.loaded', 6000);
    });

    api.loadPlaylists((res) => {
        console.log('load playlists',{res});
    });

    const windowContentElem = document.getElementById('window-folder');
    const fileBrowser = new FileBrowser(audioPlayer);
    const fileBrowserLayout = new Layout(windowContentElem, 'folderBroser');
    const fileBrowserRenderer = new FileBrowserRenderer(fileBrowser, fileBrowserLayout, document.querySelector('#file-browser-action button.open-file-browser'));
    layoutHTML.addHTMLLayout(fileBrowserLayout);

    fileBrowser.onSongAdded(tracklistGrid.appendTrackToGrid.bind(tracklistGrid));

    const volumeCnt = document.querySelector('#volume-display');
    const volumeCntDisplay = document.querySelector('#volume-display .vol-val');
    const muteCnt = document.querySelector('#muted-display');
    const muteOn = document.querySelector('#muted-display #mute-on');
    const muteOff = document.querySelector('#muted-display #mute-off');

    audioPlayer.onVolumeChange((volume) => {
        volumeCntDisplay.innerText = Math.round(volume * 100);
    });

    audioPlayer.onRepeatSwitch(TrackListManager.switchRepeatMode.bind(TrackListManager), TrackListManager);

    keyCotrols.registerKeyDownAction('m', () => {
        audioPlayer.mute();
        muteCnt.style.display = 'block';
        if (audioPlayer.isMuted()) {
            muteOn.style.display = 'block';
            muteOff.style.display = 'none';
        } else {
            muteOn.style.display = 'none';
            muteOff.style.display = 'block';
        }

        setTimeout(() => {
            muteOn.style.display = 'none';
            muteOff.style.display = 'none';
            muteCnt.style.display = 'none';
        }, 1668);
    });

    keyCotrols.registerKeyDownAction('a', tracklistGrid.open.bind(tracklistGrid), tracklistGrid);
    keyCotrols.registerKeyDownAction('Escape', tracklistGrid.close.bind(tracklistGrid), tracklistGrid);

    document.querySelector('#file-browser-action button.open-tracklist-browser').addEventListener('click', tracklistGrid.open.bind(tracklistGrid));

    document.querySelector('#file-browser-action button.open-playlist-create').addEventListener(
        'click',
        playlistCreation.show.bind(playlistCreation)
    );
    
    keyCotrols.registerKeyDownAction('n', playlistCreation.show.bind(playlistCreation));

    let volUpEvtId = -1;
    let volDownEvtId = -1;
    
    const volumeFader = new Fader();

    keyCotrols.registerKeyDownAction('+', () => {
        volumeFader.cancelFade();
        if (volUpEvtId >= 0) {
            clearTimeout(volUpEvtId);
            volUpEvtId = -1;
        }
        if (volDownEvtId >= 0) {
            clearTimeout(volDownEvtId);
            volDownEvtId = -1;
        }
        volumeCnt.style.opacity = 1;
        volumeCnt.style.display = 'block';
    });
    keyCotrols.registerKeyUpAction('+', () => {
        volUpEvtId = setTimeout(() => {
            volumeFader.fadeOut(volumeCnt, 400, 1, 0);
        }, 568);
    });
    
    keyCotrols.registerKeyDownAction('-',  () => {
        volumeFader.cancelFade();
        if (volDownEvtId >= 0) {
            clearTimeout(volDownEvtId);
            volDownEvtId = -1;
        }
        if (volUpEvtId >= 0) {
            clearTimeout(volUpEvtId);
            volUpEvtId = -1;
        }
        volumeCnt.style.opacity = 1;
        volumeCnt.style.display = 'block';
    });
    keyCotrols.registerKeyUpAction('-', () => {
        volDownEvtId = setTimeout(() => {
            volumeFader.fadeOut(volumeCnt, 400, 1, 0);
        }, 568);
    });

})(this, document, this.JSPlayer);