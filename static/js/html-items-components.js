/**
 * HTML Items Components Module
 * Provides reusable HTML components for the music player application, such as the HoverEffect and ProgressBar.
 * The HoverEffect class adds a dynamic background effect to HTML elements based on mouse position, enhancing the visual interactivity of the UI.
 * The ProgressBar class implements a customizable progress bar that can be used for tracking audio playback progress, with support for seeking and real-time updates.
 * Both components are designed to be easily integrated into various parts of the application, allowing for consistent styling and behavior across different contexts.
 * The module promotes code reusability and maintainability by encapsulating specific UI behaviors within dedicated classes, making it easier to manage and update these components as needed.
 * Overall, this module serves as a crucial part of the music player application, providing visually appealing and functional UI elements that enhance the user experience when interacting with the audio player and other features of the application.
 * The design allows for easy extension in the future, enabling additional components or enhancements to existing ones without affecting the overall structure of the application. This modular approach ensures that the application remains flexible and adaptable to future requirements and design changes.
 * In summary, the HTML Items Components Module provides a robust foundation for building interactive and visually engaging UI elements within the music player application, contributing to a polished and professional user experience.
 */
import {HTMLItems} from './html-items.js';
import {ListEvents} from './event-manager.js';
import {TrackListManager} from './tracklistv2.js';
import {getPercentageWidthFromMousePosition, whileMousePressedAndMove} from './utils.js';

const HoverEffect = function(htmlItem) {
    this.htmlItem = htmlItem;
};
HoverEffect.prototype = {
    setUp() {
        this.htmlItem.addEventListener('mouseenter', (evt) => {
            const percentWidth = (getPercentageWidthFromMousePosition(evt.clientX, this.htmlItem) * 100).toFixed(2);
            this.htmlItem.css({background: `linear-gradient(90deg, rgba(255, 124, 120, 0.6) ${percentWidth}%, #292929 0%)`});
        });

        this.htmlItem.addEventListener('mousemove', (evt) => {
            const percentWidth = (getPercentageWidthFromMousePosition(evt.clientX, this.htmlItem) * 100).toFixed(2);
            this.htmlItem.css({background: `linear-gradient(90deg, rgba(255, 124, 120, 0.6) ${percentWidth}%, #292929 0%)`});
        });

        this.htmlItem.addEventListener('mouseleave', () => {
            this.htmlItem.css({background: "#181717"});
        });
    }
}

const ProgerssBar = function(parentCnt) {
    this.listEvents = new ListEvents();
    this.mainDiv = new HTMLItems('div');
    this.subDiv = new HTMLItems('div');
    
    this.setUp(parentCnt);
};
ProgerssBar.prototype = {
    setUp(parentCnt) {
        this.mainDiv.id('progress');
        this.subDiv.id('prog-bar');
        this.mainDiv.append(this.subDiv);
        
        parentCnt.append(this.mainDiv.render());
        const hoverEffect = new HoverEffect(this.mainDiv);
        hoverEffect.setUp();

        whileMousePressedAndMove(this.mainDiv.render(), this.seek.bind(this));
        whileMousePressedAndMove(this.subDiv.render(), this.seek.bind(this));
    },
    seek(evt, mouseDown) {
        const percentWidth = getPercentageWidthFromMousePosition(evt.clientX, this.mainDiv);
        this.disableProgress = mouseDown;
        this._updateProgressBar(percentWidth  * 100);
        this.listEvents.trigger('onSeek', percentWidth, mouseDown);
    },
    onSeek(cb, subscriber) {
        this.listEvents.onEventRegister({cb, subscriber}, 'onSeek');
    },
    progress(current, total, cb) {
        if (current > total || this.disableProgress)
            return false;
        let percentProg = (current / total) * 100;
        this._updateProgressBar(percentProg, cb);
        return true;
    },
    reset() {
        this._updateProgressBar(0);
    },
    _updateProgressBar(progress, cb) {
        requestAnimationFrame(() => {
            if (progress > 100)
                progress = 100;
            this.subDiv.width(progress, '%');
            if (typeof cb === 'function')
                cb();
        });
    },
};

const AudioPlayerProgressBar = function() {
    this.isPaused = true;
    this.progressBar = new ProgerssBar(document.getElementById('player'));
};
AudioPlayerProgressBar.prototype = {
    setAudioPlayer(audioPlayer) {
        this.audioPlayer = audioPlayer;
    },
    togglePauseProgress(isPaused) {
        this.setPauseState(isPaused);
        if (!isPaused) {
            this.progress();
        }
    },
    progress() {
        if (this.isPaused)
            return;
        
        let currentTime = this.audioPlayer.getCurrentTime(),
            totalTime = this.audioPlayer.getDuration();
        this.progressBar.progress(currentTime, totalTime, this.progress.bind(this));
    },
    doProgress(currentTime, duration) {
        if (this.isPaused)
            return;
        this.progressBar.progress(currentTime, duration);
    },
    updateProgress() {
        let currentTime = this.audioPlayer.getCurrentTime(),
            totalTime = this.audioPlayer.getDuration();
        this.progressBar.progress(currentTime, totalTime);
    },
    seek(percentWidth) {
        const {track} = TrackListManager.getCurrentTrack();
        console.log('seek', {percentWidth, trackDuration: track.getTrackDuration()});
        this.audioPlayer.setCurrentTime(track.getTrackDuration() * percentWidth);
        this.progress();
    },
    resetProgresBar() {
        this.progressBar.reset();
    },
    setPauseState(isPaused) {
        this.isPaused = isPaused;
    }
}

export {ProgerssBar, AudioPlayerProgressBar};