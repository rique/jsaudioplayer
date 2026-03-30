/**
 * Main entry point for the application. This file is responsible for initializing the application and loading the necessary resources.
 * It sets up the audio player, track list, notifications, and other components of the application.
 * The main responsibilities include:
 * - Loading the track list and album art from the server.
 * - Initializing the audio player and its display.
 * - Setting up event listeners for user interactions and keyboard controls.
 * - Managing the state of the application and coordinating between different components.
 * The code is organized to ensure a clear separation of concerns and maintainability, allowing for easy updates and feature additions in the future.
 * It also integrates with the Notifications Center to provide feedback to the user about various actions and states of the application.
 * Overall, this file serves as the central hub for orchestrating the different parts of the music player application.
 */
import {NotificationCenter} from './notifications-center.js';
import {PlaybackMediator} from './mediators.js';
import {Track, ID3Tags} from './tracks.js';
import {TrackListManager} from './tracklistv2.js';
import {TracklistGrid} from './grid.js';
import draw from './visualizer.js';
import {AudioPlayer, AudioPlayerDisplay} from './playerV2.js';
import {keyCotrols, AudioPlayerKeyControls} from './event-manager.js';
import {Fader} from './effects.js';
import {LeftMenu, FileBrowser, Layout, layoutHTML, FileBrowserRenderer, TrackListBrowser} from './components.js';
import {AudioPlayerProgressBar} from './html-items-components.js';
import {PlayerControls, PlayerButtons} from './player-controls.js';
import {PlaylistCreator} from './playlists.js';
import Library from './library.js';
import Api from './api.js';

const imgList = [];
const audioPlayerProgressBar = new AudioPlayerProgressBar();
const audioPlayer = new AudioPlayer(audioPlayerProgressBar);
const audioPlayerDisplay = new AudioPlayerDisplay(audioPlayer);
audioPlayerProgressBar.setAudioPlayer(audioPlayer);

const library = new Library();
const playerControls = new PlayerControls(audioPlayer);
const playerButtons = new PlayerButtons(document.getElementById('player-controls'), playerControls);
playerButtons.setUp();
const api = new Api();
const audioPlayerKeyControls = new AudioPlayerKeyControls(keyCotrols);

audioPlayerKeyControls.setPlayerControls(playerControls);
audioPlayerKeyControls.onFastForward(audioPlayerProgressBar.updateProgress.bind(audioPlayerProgressBar), audioPlayerProgressBar);
audioPlayerKeyControls.onRewind(audioPlayerProgressBar.updateProgress.bind(audioPlayerProgressBar), audioPlayerProgressBar);

const trackListBrowser = new TrackListBrowser(audioPlayer, audioPlayerDisplay);
const tracklistGrid = new TracklistGrid('#table-content', audioPlayer, trackListBrowser);
trackListBrowser.setGrid(tracklistGrid);

PlaybackMediator.init(
    trackListBrowser, 
    tracklistGrid, 
    tracklistGrid.getQueueGrid(), 
    audioPlayer
);

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
    if (TrackListManager.getTracksNumber() > 0)
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
