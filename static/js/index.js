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
import {PlayerNotifications} from './notifications.js';
import {PlaybackMediator, PlayerControlMediator} from './mediators.js';
import {TrackListManager} from './tracklistv2.js';
import {TracklistGrid} from './grid.js';
import draw from './visualizer.js';
import {AudioPlayer, AudioPlayerDisplay} from './playerV2.js';
import {keyCotrols, AudioPlayerKeyControls} from './event-manager.js';
import {LeftMenu, FileBrowser, Layout, layoutHTML, FileBrowserRenderer, TrackListBrowser} from './components.js';
import {AudioPlayerProgressBar} from './html-items-components.js';
import {PlayerControls, PlayerButtons} from './player-controls.js';
import {PlaylistCreator} from './playlists.js';
import library from './library.js';
import Api from './api.js';

const imgList = [];
const audioPlayerProgressBar = new AudioPlayerProgressBar();
const audioPlayer = new AudioPlayer(audioPlayerProgressBar);
const audioPlayerDisplay = new AudioPlayerDisplay(audioPlayer);
audioPlayerProgressBar.setAudioPlayer(audioPlayer);

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
const playlistCreation = new PlaylistCreator();
trackListBrowser.setGrid(tracklistGrid);

const windowContentElem = document.getElementById('window-folder');
const fileBrowserLayout = new Layout(windowContentElem, 'folderBroser');
const fileBrowser = new FileBrowser(fileBrowserLayout);
const fileBrowserRenderer = new FileBrowserRenderer(fileBrowser, fileBrowserLayout);
layoutHTML.addHTMLLayout(fileBrowserLayout);

fileBrowser.onSongAdded(tracklistGrid.appendTrackToGrid.bind(tracklistGrid));

PlaybackMediator.init(
    trackListBrowser, 
    tracklistGrid, 
    tracklistGrid.getQueueGrid(), 
    audioPlayer
);

PlayerControlMediator.init(
    audioPlayer, 
    audioPlayerDisplay, 
    audioPlayerProgressBar, 
    PlayerNotifications,
    playerControls,
    keyCotrols,
    {tracklistGrid, playlistCreation, fileBrowser, trackListBrowser}
);

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

api.loadTrackList((res) => {
    audioPlayer.init();
    library.bootstrap(res['tracklist']).then(() => {
        TrackListManager.setPlaylist(library.getPlaylist());
    
        if (TrackListManager.getTracksNumber() > 0)
            audioPlayer.setCurrentTrackFromTrackList(false);
        
        NotificationCenter.modifyNotification({
            message: `<p>${TrackListManager.getTracksNumber()} tracks have been loaded!!<p>`
        }, 'tracks.loaded');
        NotificationCenter.displayNotification('tracks.loaded', 6000);
    }); 
});

api.loadPlaylists((res) => {
    console.log('load playlists',{res});
});

