(function(window, document, JSPlayer, undefined) {

    const NotificationCenter = JSPlayer.NotificationCenter;
    const Track = JSPlayer.Tracks.Track;
    const TrackList = JSPlayer.Tracks.TrackList;
    const ID3Tags = JSPlayer.Tracks.ID3Tags;
    const GridMaker = window.JSPlayer.GridMaker;
    const draw = JSPlayer.Vizualizer.draw;
    const AudioPlayer = JSPlayer.AudioPlayer;

    const imgList = [];
    const api = new JSPlayer.Api();
    const gridMaker = new GridMaker(document.getElementById('table-content'), true);
    const mainTracklist = new TrackList();
    const audioPlayer = new AudioPlayer(mainTracklist);

    NotificationCenter.registerNotification({
        title: 'Tracks Loaded!!',
        level: 'info'
    }, 'tracks.loaded');

    api.loadBGImages(function(res) {
            imgList.push(...res['img_list']);

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
                    },
                    onValidate: (evt, value) => {
                        console.log('Title validate value', value);
                    },
                    width: 24,
                    unit: '%',
                    type: 'str',
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
                    unit: '%',
                    type: 'str',
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
                    unit: '%',
                    type: 'str',
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

        const audioCtx = new AudioContext();
        const audioSourceNode = audioCtx.createMediaElementSource(audioPlayer.audioElem);

        //Create analyser node
        const analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 256;
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);

        //Set up audio node network
        audioSourceNode.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);

        //Create 2D canvas
        const canvas = document.createElement("canvas");
        
        canvas.width = window.innerWidth - 36;
        canvas.height = window.innerHeight - 204;
        canvas.style.display = 'block';
        canvas.style.margin = 'auto';
        
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth - 36;
            canvas.height = window.innerHeight - 204;
        });
        
        document.body.appendChild(canvas);
        
        const canvasCtx = canvas.getContext("2d");
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        let curImg = 'img1.jpg';
        let background = new Image();
        background.src = `http://jsradio.me:3600/static/${curImg}`;

        background.onload = () => {
            console.log('img loaded', background.width, background.height, canvas.width, canvas.height);
            let width = 0, height = 0, x = 0, y = 0;
            //let coef = (canvas.width / background.width) * .8;
            let coef = (canvas.height / background.height) * 1.05;
            width =  background.width * coef;
            height = background.height * coef;
            x = parseInt((canvas.width / 2) - (width / 2));
            canvasCtx.globalAlpha = .1;
            canvasCtx.drawImage(background, x, y, width, height);
            canvasCtx.globalAlpha = 1;

            draw(0, true, 0, analyserNode, dataArray, bufferLength, canvasCtx, canvas, background, imgList);
        }

        
    });

})(this, document, this.JSPlayer);