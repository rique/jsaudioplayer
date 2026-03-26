/* * Notifications Module
 * Provides a set of classes and functions to manage and display notifications related to tracklist browsing, player status, and file browsing.
 * Integrates with the Notifications Center to ensure consistent styling and behavior across different types of notifications.
 * Each class encapsulates specific notification logic for its respective context, allowing for easy maintenance and scalability.
 * The module includes:
 * - TracklistBrowserNotifications: Manages notifications related to adding tracks to the queue and removing tracks from the tracklist.
 * - PlayerNotifications: Handles notifications for upcoming tracks in the player.
 * - FileBrowserNotifications: Manages notifications for actions performed in the file browser, such as adding new tracks.
 * The code is organized to ensure a clear separation of concerns, with each class responsible for its own notification logic while leveraging the shared functionality of the Notifications Center.
 * Overall, this module enhances the user experience by providing timely and relevant feedback about various actions and states within the music player application. 
 * The design allows for easy updates and additions to the notification system in the future, ensuring that the application can continue to provide informative feedback as new features are introduced.
 * The module also promotes code reusability and maintainability by centralizing notification management and allowing for dynamic content updates through the use of templates and asynchronous data handling.
 * In summary, this module serves as a crucial component of the music player application, providing a robust and flexible system for managing notifications across different contexts, ultimately enhancing the overall user experience.
 */
import {NotificationCenter, TrackBoxTemplate} from './notifications-center.js';

const TracklistBrowserNotificationsCls = function() {
    this.addedToQueueKey = 'track.addedToQueue';
    this.removedTrackKey = 'track.removedTrack';

    NotificationCenter.registerNotification({
        title: 'Track added to queue!',
        level: 'info',
        }, this.addedToQueueKey);
    
    NotificationCenter.registerNotification({
        title: '⚠️ Track removed!',
        level: 'warning',
        }, this.removedTrackKey);
};
TracklistBrowserNotificationsCls.prototype = {
    setAddedTrackToQueue(track, timeout) {
        const tpl = new TrackBoxTemplate(track);
        NotificationCenter.modifyNotification({message: tpl.render()}, this.addedToQueueKey);
        NotificationCenter.displayNotification(this.addedToQueueKey, timeout);
    },
    hideAddedTrackToQueue() {
        NotificationCenter.hideNotification(this.addedToQueueKey);
    },
    setARemovedTrack(track, timeout) {
        const tpl = new TrackBoxTemplate(track);
        NotificationCenter.modifyNotification({message: tpl.render()}, this.removedTrackKey);
        NotificationCenter.displayNotification(this.removedTrackKey, timeout);
    },
    hideARemovedTrack() {
        NotificationCenter.hideNotification(this.removedTrackKey);
    },
}

const PlayerNotificationCls = function() {
    this.comingNextKey = 'player.comingNext';
    NotificationCenter.registerNotification({
        title: 'Coming Up Next',
        level: 'info',
    }, this.comingNextKey);
};
PlayerNotificationCls.prototype = {
    setComingNext(track, timeout) {
        const tpl = new TrackBoxTemplate(track);
        NotificationCenter.modifyNotification({message: tpl.render()}, this.comingNextKey);
        NotificationCenter.displayNotification(this.comingNextKey, timeout);
    },
    hideComingNext() {
        NotificationCenter.hideNotification(this.comingNextKey);
    },
};

const FileBrowserNotificationsCls = function() {
    this.trackAddedKey = 'filebrowser.added';
    NotificationCenter.registerNotification({
        title: 'New track successfully added!',
        level: 'info',
    }, this.trackAddedKey);
};
FileBrowserNotificationsCls.prototype = {
    setAddedTrack(track, timeout) {
        const tpl = new TrackBoxTemplate(track);
        NotificationCenter.modifyNotification({message:  tpl.render()}, this.trackAddedKey);
        NotificationCenter.displayNotification(this.trackAddedKey, timeout);
    },
    hideAddedTrack() {
        NotificationCenter.hideNotification(this.trackAddedKey);
    },
}; 

const TracklistBrowserNotifications = new TracklistBrowserNotificationsCls(),
    PlayerNotifications = new PlayerNotificationCls(),
    FileBrowserNotifications = new FileBrowserNotificationsCls();

export {
    TracklistBrowserNotifications,
    PlayerNotifications,
    FileBrowserNotifications,
};