(function(window, document, JSPlayer, undefined) {

    const NotificationCenter = JSPlayer.NotificationCenter;
    const Track = JSPlayer.Tracks.Track;
    const TrackList = JSPlayer.Tracks.TrackList;
    const ID3Tags = JSPlayer.Tracks.ID3Tags;
    const GridMaker = window.JSPlayer.GridMaker;

    const api = new JSPlayer.Api();
    const gridMaker = new GridMaker(document.getElementById('table-content'), true);
    const mainTracklist = new TrackList();

    NotificationCenter.registerNotification({
        title: 'Tracks Loaded!!',
        level: 'info'
    }, 'tracks.loaded');
    api.loadTrackList(function(res) {
        gridMaker.setDraggable(true, true);
        
        gridMaker.makeRowIdx([{
            content: 'N°',
            sorterCell: true,
            width: 8,
            unit: '%'
        },{
            content: 'Title',
            sorterCell: true,
            width: 24,
            unit: '%'
        },{
            content: 'Artist',
            sorterCell: true,
            width: 24,
            unit: '%'
        },{
            content: 'Album',
            sorterCell: true,
            width: 24,
            unit: '%'
        }, {
            content: 'duration',
            sorterCell: true,
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
                content: parseInt(i + 1).toString(),
                width: 8,
                unit: '%'
            },{
                content: track.getTitle(),
                editable: true,
                onEdit: (evt) => {
                    console.log('Title editing!', evt);
                },
                onValidate: (evt, value) => {
                    console.log('Title validate value', value);
                },
                width: 24,
                unit: '%'
            },{
                content: track.getArtist(),
                editable: true,
                onEdit: (evt) => {
                    console.log('Artist editing!', evt);
                },
                onValidate: (evt, value) => {
                    console.log('Artist validate value', value);
                },
                width: 24,
                unit: '%'
            },{
                content: track.getAlbum(),
                editable: true,
                onEdit: (evt) => {
                    console.log('Album editing!', evt);
                },
                onValidate: (evt, value) => {
                    console.log('Album validate value', value);
                },
                width: 24,
                unit: '%'
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
            }], true, false, i + 1);

            mainTracklist.addTrackToList(track);
        }
        
        gridMaker.render();

        NotificationCenter.modifyNotification({
            message: `<p>${mainTracklist.getTracksNumber()} tracks have been loaded!!<p>`
        }, 'tracks.loaded');
        NotificationCenter.displayNotification('tracks.loaded', 6000);
    });
})(this, document, this.JSPlayer);