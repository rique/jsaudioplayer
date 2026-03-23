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