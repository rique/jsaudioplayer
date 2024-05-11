(function(window, document, JSPlayer, undefined) {

    const NotificationCenter = JSPlayer.NotificationCenter;
    const Track = JSPlayer.Tracks.Track;
    const TrackList = JSPlayer.Tracks.TrackList;
    const ID3Tags = JSPlayer.Tracks.ID3Tags;
    const GridMaker = window.JSPlayer.GridMaker;
    const draw = JSPlayer.Vizualizer.draw;
    const AudioPlayer = JSPlayer.AudioPlayer;
    const KeyCotrols = JSPlayer.EventsManager.KeyCotrols;
    const Fader = JSPlayer.Effects.Fader;
    const LeftMenu = JSPlayer.Components.LeftMenu;

    const imgList = [];
    const api = new JSPlayer.Api();
    const gridMaker = new GridMaker(document.getElementById('table-content'), true);
    const mainTracklist = new TrackList();
    const audioPlayer = new AudioPlayer(mainTracklist);
    const leftMenu = new LeftMenu();
    leftMenu.init();

    const keyCotrols = new KeyCotrols();

    NotificationCenter.registerNotification({
        title: 'Tracks Loaded!!',
        level: 'info'
    }, 'tracks.loaded');

    api.loadBGImages((res) => {
        imgList.push(...res['img_list']);
        draw(audioPlayer, imgList);
    });

    api.loadTrackList(function(res) {
        gridMaker.setDraggable(true, true);
        audioPlayer.init();
        
        gridMaker.makeRowIdx([{
            content: 'N°',
            sorterCell: true,
            width: 8,
            unit: '%',
            type: 'int',
            textAlign: 'center',
        },{
            content: 'Title',
            sorterCell: true,
            width: 24,
            unit: '%',
            type: 'str',
            textAlign: 'center',
        },{
            content: 'Artist',
            sorterCell: true,
            width: 24,
            unit: '%',
            type: 'str',
            textAlign: 'center',
        },{
            content: 'Album',
            sorterCell: true,
            width: 24,
            unit: '%',
            type: 'str',
            textAlign: 'center',
        }, {
            content: 'duration',
            sorterCell: true,
            width: 8,
            unit: '%',
            type: 'str',
            textAlign: 'center',
        }, {
            content: '&nbsp;',
            width: 4,
            unit: '%'
        }, {
            content: '&nbsp;',
            width: 4,
            unit: '%'
        }, {
            content: '&nbsp;',
            width: 4,
            unit: '%'
        }], true, true, 0); 
        
        for (let i in res['tracklist']) {
            let trackInfo = res['tracklist'][i];
            let track = new Track(trackInfo['track']),
                id3Tags = new ID3Tags(trackInfo['ID3']);
            track.setID3Tags(id3Tags);
            track.setTrackDuration(id3Tags.getDuration());

            gridMaker.makeRowIdx([{
                content: parseInt(i) + 1,
                width: 8,
                unit: '%',
                type: 'int',
            },{
                content: track.getTitle(),
                editable: true,
                onEdit: (evt) => {
                    console.log('Title editing!', evt);
                    keyCotrols.setExlcusivityCallerKeyUpV2('tarck.edit');
                },
                onValidate: (evt, cell, value) => {
                    console.log('Title validate value', cell, cell.data('trackId'), value);
                    keyCotrols.unsetExlcusivityCallerKeyUpV2('tarck.edit');
                },
                width: 24,
                unit: '%',
                type: 'str',
                data: {
                    trackId: track.trackUUid,
                }
            },{
                content: track.getArtist(),
                editable: true,
                onEdit: (evt) => {
                    console.log('Artist editing!', evt);
                    keyCotrols.setExlcusivityCallerKeyUpV2('tarck.edit');
                },
                onValidate: (evt, cell, value) => {
                    console.log('Artist validate value', cell, cell.data('trackId'), value);
                    keyCotrols.unsetExlcusivityCallerKeyUpV2('tarck.edit');
                },
                width: 24,
                unit: '%',
                type: 'str',
                data: {
                    trackId: track.trackUUid,
                }
            },{
                content: track.getAlbum(),
                editable: true,
                onEdit: (evt) => {
                    console.log('Album editing!', evt);
                    keyCotrols.setExlcusivityCallerKeyUpV2('tarck.edit');
                },
                onValidate: (evt, cell, value) => {
                    console.log('Album validate value', cell, cell.data('trackId'), value);
                    keyCotrols.unsetExlcusivityCallerKeyUpV2('tarck.edit');
                },
                width: 24,
                unit: '%',
                type: 'str',
                data: {
                    trackId: track.trackUUid,
                }
            }, {
                content: track.getTrackDuration(true),
                width: 8,
                unit: '%'
            }, {
                content: '&nbsp;',
                width: 4,
                unit: '%'
            }, {
                content: '&nbsp;',
                width: 4,
                unit: '%'
            }, {
                content: 'drag',
                draggable: true,
                onDragged: (evt) => {
                    evt.detail.HTMLItem.innerContent('Drop me!!');
                },
                onDropped: (evt) => {
                    evt.detail.HTMLItem.innerContent('drag');
                },
                width: 4,
                unit: '%'
            }], true, false, parseInt(i) + 1);

            mainTracklist.addTrackToList(track);
        }
        audioPlayer.setCurrentTrackFromTrackList(false);
        gridMaker.render();

        NotificationCenter.modifyNotification({
            message: `<p>${mainTracklist.getTracksNumber()} tracks have been loaded!!<p>`
        }, 'tracks.loaded');
        NotificationCenter.displayNotification('tracks.loaded', 6000);
    
    });

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