(function(window, document, JSPlayer, undefined) {
    const NotificationCenter = JSPlayer.NotificationCenter;
    const TrackBoxTemplate = JSPlayer.NotificationTemplates.TrackBoxTemplate;

    const TracklistBrowserNotifications = function() {
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
    TracklistBrowserNotifications.prototype = {
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

    const PlayerNotifications = function() {
        this.comingNextKey = 'player.comingNext';
        NotificationCenter.registerNotification({
            title: 'Coming Up Next',
            level: 'info',
        }, this.comingNextKey);
    };
    PlayerNotifications.prototype = {
        setComingNext(track, timeout) {
            const tpl = new TrackBoxTemplate(track);
            NotificationCenter.modifyNotification({message: tpl.render()}, this.comingNextKey);
            NotificationCenter.displayNotification(this.comingNextKey, timeout);
        },
        hideComingNext() {
            NotificationCenter.hideNotification(this.comingNextKey);
        },
    };

    const FileBrowserNotifications = function() {
        this.trackAddedKey = 'filebrowser.added';
        NotificationCenter.registerNotification({
            title: 'New track successfully added!',
            level: 'info',
        }, this.trackAddedKey);
    };
    FileBrowserNotifications.prototype = {
        setAddedTrack(track, timeout) {
            const tpl = new TrackBoxTemplate(track);
            NotificationCenter.modifyNotification({message:  tpl.render()}, this.trackAddedKey);
            NotificationCenter.displayNotification(this.trackAddedKey, timeout);
        },
        hideAddedTrack() {
            NotificationCenter.hideNotification(this.trackAddedKey);
        },
    };

    JSPlayer.Notifications = {
        TracklistBrowserNotifications: new TracklistBrowserNotifications(),
        PlayerNotifications: new PlayerNotifications(),
        FileBrowserNotifications: new FileBrowserNotifications(),
    }

})(this, document, this.JSPlayer);