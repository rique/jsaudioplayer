const readCookie = function (name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};


const blob2Uint8Array = (blob) => {
    return new Response(blob).arrayBuffer().then(buffer=> {
        return [...new Uint8Array(buffer)];
    });
};


const clearElementInnerHTML = (element) => {
    while(element.firstChild)
        element.removeChild(element.firstChild);
}


const Api = function() {
    this.url = 'http://localhost:8888/api';
    this.xhr = new XMLHttpRequest();
    this.csrftoken = readCookie('csrftoken');
}

Api.prototype = {
    getXhrPost(url) {
        this.xhr.open('POST', url, true);
        return this.xhr; 
    },
    browseFiles(baseDir, callback) {
        let xhr = this.getXhrPost(`${this.url}/file-browser`);
        let data = JSON.stringify({
            'base_dir': baseDir
        });

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.setRequestHeader("X-CSRFToken", this.csrftoken);
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    addTrack(trackName, trackFullPath, callback) {
        let xhr = this.getXhrPost(`${this.url}/add-track`);
        let data = JSON.stringify({
            track_name: trackName,
            track_original_path: trackFullPath
        });

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.setRequestHeader("X-CSRFToken", this.csrftoken);
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    },
    loadTrackList(callback) {
        let xhr = this.getXhrPost(`${this.url}/load-track-list`);
        let data = JSON.stringify({});

        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.setRequestHeader("X-CSRFToken", this.csrftoken);
        xhr.send(data);

        xhr.onload = () => {
            console.log('xhr', xhr.status);
            callback(JSON.parse(xhr.response));
        }
    }
};

/*
track_name = models.CharField(max_length=256)
    track_uuid = models.CharField(max_length=36)
    track_original_path = models.CharField(max_length=256)
    track_date_added = models.DateTimeField(auto_now_add=True)
*/
const Track = function(trackInfo) {
    this.trackName = trackInfo.track_name;
    this.trackUUid = trackInfo.track_uuid;
    this.trackOriginalPath = trackInfo.track_original_path;
    this.trackDuration = undefined;
}

track.prototype = {
    setTrackDuration(duration) {
        this.trackDuration = duration;
    }
};


const AudioPlayer = function(tracklist, api) {
    if (!tracklist) {
        console.error('No tracklist provided');
        throw 'No tracklist provided';
    }
        
    this.tracklist = tracklist;
    this.currentTrack = tracklist[0];
    
    this.repeat = true;
    this.repeatElem = document.querySelector('#repeat-button a');

    this.albumImg = document.getElementById('album-art');
    this.titleTrack = document.getElementById('track-title');
    this.titleAlbum = document.getElementById('album-title');

    this.playBtn = document.getElementById('play-button');
    this.pauseBtn = document.getElementById('pause-button');
    this.stopBtn = document.getElementById('stop-button');
    this.prevBtn = document.getElementById('prev-button');
    this.nextBtn = document.getElementById('next-button');

    this.progressBarDiv = document.getElementById('prog-bar');

    this.c = 0;
    this.max = tracklist.length;
    this.audioEle = new Audio();
    this.jsmediatags = window.jsmediatags;
    this.api = api;
}

AudioPlayer.prototype = {
    init() {
        this.loadID3Tags(this.currentTrack);
        this.audioEle.src = "/static/" + this.currentTrack;
        this.audioEle.autoplay = false;
        this.audioEle.preload = "auto";
        this.audioEle.onloadedmetadata = this.onAudioLoaded.bind(this);
        this.audioEle.onended = this.onAudioEnded.bind(this);
        
        this.playBtn.addEventListener('click', function(evt) {
            evt.preventDefault();
            this.play();
        }.bind(this));

        this.pauseBtn.addEventListener('click', function(evt) {
            evt.preventDefault();
            this.pause();
        }.bind(this));

        this.stopBtn.addEventListener('click', function(evt) {
            evt.preventDefault();
            this.stop();
        }.bind(this));

        this.prevBtn.addEventListener('click', function(evt) {
            evt.preventDefault();
            this.prev();
        }.bind(this));

        this.nextBtn.addEventListener('click', function(evt) {
            evt.preventDefault();
            this.next();
        }.bind(this));

        this.repeatElem.addEventListener('click', function(evt) {
            evt.preventDefault();
            evt.target.classList.toggle('repeat-active');
            this.btnRepeat();
        }.bind(this));

        this.api.loadTrackList(function(res) {
            for (trackinfo of res['tracklist']) {
                this.tracklist.push(`${trackinfo.track_uuid}.mp3`);
                ++this.max;
            }
        }.bind(this));
    },
    setTrackList(tracklist) {
        this.tracklist = tracklist;
    },
    setPlayerSong(song) {
        this.currentTrack = song;
        this.audioEle.src = `/static/${song}`;
        this.audioEle.onloadedmetadata = this.onAudioLoaded.bind(this);
        this.audioEle.play();
    },
    play() {
        this.audioEle.play();
    },
    pause() {
        this.audioEle.pause();
    },
    stop() {
        this.audioEle.pause();
        this.audioEle.currentTime = 0;
    },
    next() {
        ++this.c;
        if (this.c >= this.max)
            this.c = 0;
        let song = this.tracklist[this.c];
        console.log('playing song', song);

        this.loadID3Tags(song);
        this.setPlayerSong(song);
    },
    prev() {
        --this.c;
        if (this.c < 0)
            this.c = this.max - 1;
        let song = this.tracklist[this.c];
        console.log('playing song', song);

        this.loadID3Tags(song);

        this.setPlayerSong(song);
    },
    btnRepeat() {
        this.repeat = !this.repeat;
        console.log('repeat', this.repeat);
    },
    onAudioLoaded(evt) {
        let audioElem = evt.target;
        console.log('duration', audioElem.duration);
        this.progressBar(audioElem);
    },
    progressBar(audioELem) {
        let currentTime = audioELem.currentTime,
            totalTime = audioELem.duration;
        if (totalTime >= currentTime) {
            let percentProg = (currentTime / totalTime) * 100;
            this.progressBarDiv.style.width = `${percentProg.toFixed(2)}%`;
            setTimeout(() => {
                this.progressBar(audioELem);
            }, 100);
        }
    },
    onAudioEnded() {
        ++this.c;
        if (this.c >= this.max) {
            if (!this.repeat)
                return  console.log('End of session'); 
            this.c = 0;
        }

        let song = this.tracklist[this.c];
        console.log('playing song', song);

        this.loadID3Tags(song);
        this.setPlayerSong(song);
       
    },
    loadID3Tags(song) {
        this.jsmediatags.read(`http://localhost:8888/static/${song}`, {
            onSuccess: this.manageTags.bind(this),
            onError(error) {
                console.error(':(', error);
            }
        });
    },
    manageTags(tag) {
        if (!tag.hasOwnProperty('tags'))
            return;
        
        let tags = tag.tags;
        this.titleTrack.innerText = tags.title;
        this.titleAlbum.innerText = tags.album;

        if (!tags.hasOwnProperty('picture'))
            return this.albumImg.src = "/static/albumart.jpg";
        
        const { data, format } = tags.picture;
        let dataLen = data.length;

        if (dataLen == 0)
            return this.albumImg.src = "/static/albumart.jpg";
        
        let imgData = data.map((x) => String.fromCharCode(x)); 
        this.albumImg.src = `data:${format};base64,${window.btoa(imgData.join(''))}`;
    }
}


const FileBrowser = function(player, api) {
    this.overlayDiv = document.querySelector('.cnt-overlay');
    this.basePathBox = document.querySelector('.file-browser div.base-path');
    this.folderListBox = document.querySelector('.file-browser ul.folder-list');
    this.fileListBox = document.querySelector('.file-browser ul.file-list');
    this.baseDir = '/';
    this.api = api;
    this.browseHistory = [this.baseDir];
    this.historyIndex = 0;
    this.player = player;
    this.overlayDiv.addEventListener('click', this.closeFileBrowser.bind(this));
}

FileBrowser.prototype = {
    closeFileBrowser(evt) {
        if (evt.target != evt.currentTarget)
            return;
        clearElementInnerHTML(this.folderListBox);
        clearElementInnerHTML(this.fileListBox);
        this.overlayDiv.style.display = 'none';
    },
    folderSelector(evt) {
        let target = evt.target;
        let folderName = target.innerText.trim();
        console.log('foldername', folderName);
        if (folderName == '..') {
            let baseDirArray = this.baseDir.split('/');
            baseDirArray.splice((baseDirArray.length - 2), 1);
            this.baseDir = baseDirArray.join('/');
        } else {
            this.baseDir += folderName;
        }
        console.log('baseDir', this.baseDir);
        clearElementInnerHTML(this.folderListBox);
        clearElementInnerHTML(this.fileListBox);
        this.historyIndex++;
        this.browseHistory.push(this.baseDir);
        this.api.browseFiles(this.baseDir, this.fileBrowserCB.bind(this));
    },
    fileSelector(evt) {
        let target = evt.target;
        let fileName = target.innerText.trim();
        console.log('filename', fileName);
        this.api.addTrack(fileName, this.baseDir + fileName, function(res) {
            this.player.tracklist.push(res['mp3']);
            this.player.max++;
        }.bind(this));
    },
    fileBrowserCB(res) {
        console.log(res);
        this.overlayDiv.style.display = 'block';
        this.basePathBox.innerText = res['base_dir'];
        
        if (res['dir_list'].length > 0) {
            for (let dirName of res['dir_list']) {
                let liElem = document.createElement('li');
                liElem.classList.add('fld-itm');
                liElem.innerHTML = `<li class="fa-solid fa-folder"></li> ${dirName}`;
                liElem.addEventListener('dblclick', this.folderSelector.bind(this));
                this.folderListBox.appendChild(liElem);
            }
        }
    
        if (res['file_list'].length > 0) {
            for (let fileName of res['file_list']) {
                let liElem = document.createElement('li');
                liElem.classList.add('fle-itm');
                liElem.innerHTML = `<li class="fa-solid fa-file"></li> ${fileName}`;
                liElem.addEventListener('dblclick', this.fileSelector.bind(this));
                this.fileListBox.appendChild(liElem);
            }
        }
    },
    loadFileBrowser() {
        this.api.browseFiles(this.baseDir, this.fileBrowserCB.bind(this))
    }
};


(function(window, document) {
    let max = 5;
    let tracklist = [];
    for (let i = 0; i <= max; ++i)
        tracklist.push(`audio${i}.mp3`);
    
    const api = new Api(); 
    const audioPlayer = new AudioPlayer(tracklist, api);
    audioPlayer.init();
    // audioPlayer.loadTrackList();

    const fileBrowser = new FileBrowser(audioPlayer, api);
    document.querySelector('#file-browser-aaction button').addEventListener('click', fileBrowser.loadFileBrowser.bind(fileBrowser));
    
    const audioCtx = new AudioContext();
    const audioSourceNode = audioCtx.createMediaElementSource(audioPlayer.audioEle);

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
    canvas.height = window.innerHeight - 360;
    canvas.style.display = 'block';
    canvas.style.margin = 'auto';
    
    document.body.appendChild(canvas);
    
    const canvasCtx = canvas.getContext("2d");
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    function draw() {
        //Schedule next redraw
        requestAnimationFrame(draw);

        //Get spectrum data
        analyserNode.getFloatFrequencyData(dataArray);

        //Draw black background
        canvasCtx.fillStyle = "rgb(0 0 0)";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        //Draw spectrum
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let posX = 0;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] + 140) * 2;
            canvasCtx.fillStyle = `rgb(${Math.floor(barHeight + 100)} 50 50)`;
            canvasCtx.fillRect(
                posX,
                canvas.height - barHeight * 2,
                barWidth,
                barHeight * 2,
            );
            posX += barWidth + 1;
        }
    }

    draw();

})(this, document);
