(function(window, document, JSPlayer, undefined) {

    const NotificationCenter = JSPlayer.NotificationCenter;
    const Track = JSPlayer.Tracks.Track;
    const TrackList = JSPlayer.Tracks.TrackList;
    const ID3Tags = JSPlayer.Tracks.ID3Tags;
    const TracklistGrid = JSPlayer.Grids.TracklistGrid;
    const draw = JSPlayer.Vizualizer.draw;
    const AudioPlayer = JSPlayer.AudioPlayer;
    const keyCotrols = JSPlayer.EventsManager.KeyCotrols;
    const Fader = JSPlayer.Effects.Fader;
    const LeftMenu = JSPlayer.Components.LeftMenu;


    const FileBrowser = JSPlayer.Components.FileBrowser;
    const FileBrowserRenderer = JSPlayer.Components.FileBrowserRenderer;
    const Layout = JSPlayer.Components.Layout;
    const layoutHTML = JSPlayer.Components.layoutHTML;

    const imgList = [];
    const mainTracklist = new TrackList();
    const audioPlayer = new AudioPlayer(mainTracklist);
    const api = new JSPlayer.Api();
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
            mainTracklist.addTrackToList(track);
        }
        audioPlayer.setCurrentTrackFromTrackList(false);
        tracklistGrid.setTracklist(mainTracklist);
        tracklistGrid.buildGrid();
        tracklistGrid.render();

        NotificationCenter.modifyNotification({
            message: `<p>${mainTracklist.getTracksNumber()} tracks have been loaded!!<p>`
        }, 'tracks.loaded');
        NotificationCenter.displayNotification('tracks.loaded', 6000);
    
    });

    const windowContentElem = document.getElementById('window-folder');
    const fileBrowser = new FileBrowser(audioPlayer);
    const fileBrowserLayout = new Layout(windowContentElem, 'folderBroser');
    const fileBrowserRenderer = new FileBrowserRenderer(fileBrowser, fileBrowserLayout, document.querySelector('#file-browser-action button.open-file-browser'));
    layoutHTML.addHTMLLayout(fileBrowserLayout);

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

    keyCotrols.registerKeyDownAction('a', evt => document.querySelector('.cnt-overlay').style.display = 'block', 'trackListBrowserRenderer');
    keyCotrols.registerKeyDownAction('Escape', evt => document.querySelector('.cnt-overlay').style.display = 'none', 'trackListBrowserRenderer');

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