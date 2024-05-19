(function(window, document, JSPlayer, undefined) {

    const NotificationCenter = JSPlayer.NotificationCenter;

    const {Track, TrackList, ID3Tags} = JSPlayer.Tracks;
    const {TrackListManager} = JSPlayer.TrackListV2;
    const TracklistGrid = JSPlayer.Grids.TracklistGrid;
    const draw = JSPlayer.Vizualizer.draw;
    const AudioPlayer = JSPlayer.AudioPlayer;
    const keyCotrols = JSPlayer.EventsManager.keyCotrols;
    const Fader = JSPlayer.Effects.Fader;
    const {LeftMenu, FileBrowser, Layout, layoutHTML, FileBrowserRenderer} = JSPlayer.Components;

    const imgList = [];
    const mainTracklist = new TrackList();
    const audioPlayer = new AudioPlayer();
    const api = new JSPlayer.Api();
    
    //TrackListManager.setTracklist(mainTracklist);

    const tracklistGrid = new TracklistGrid('#table-content', audioPlayer);

    const leftMenu = new LeftMenu();
    leftMenu.init();

    NotificationCenter.registerNotification({
        title: 'Tracks Loaded!!',
        level: 'info'
    }, 'tracks.loaded');

    api.loadBGImages((res) => {
        imgList.push(...res['img_list']);
        draw(audioPlayer, imgList);
    });

    api.loadTrackList(function(res) {
        audioPlayer.init();
        
        for (let i in res['tracklist']) {
            let trackInfo = res['tracklist'][i];
            let track = new Track(trackInfo['track']),
                id3Tags = new ID3Tags(trackInfo['ID3']);
            track.setID3Tags(id3Tags);
            track.setTrackDuration(id3Tags.getDuration());
            track.setIndex(i);
            TrackListManager.addTrackToList(track);
        }
        
        tracklistGrid.setUp();
        tracklistGrid.buildGrid();
        tracklistGrid.render();
        audioPlayer.setCurrentTrackFromTrackList(false);
        
        NotificationCenter.modifyNotification({
            message: `<p>${TrackListManager.getTracksNumber()} tracks have been loaded!!<p>`
        }, 'tracks.loaded');
        NotificationCenter.displayNotification('tracks.loaded', 6000);
    
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

    keyCotrols.setPlayer(audioPlayer);

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
            //fadeOut(volumeCnt, false, 0.35);
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