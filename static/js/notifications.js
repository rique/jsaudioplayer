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
            NotificationCenter.modifyNotification({message: new TrackBoxTemplate(track)}, this.addedToQueueKey);
            NotificationCenter.displayNotification(this.addedToQueueKey, timeout);
        },
        hideAddedTrackToQueue() {
            NotificationCenter.hideNotification(this.addedToQueueKey);
        },
        setARemovedTrack(track, timeout) {
            NotificationCenter.modifyNotification({message: new TrackBoxTemplate(track)}, this.removedTrackKey);
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
            NotificationCenter.modifyNotification({message: new TrackBoxTemplate(track)}, this.comingNextKey);
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
              NotificationCenter.modifyNotification({message: new TrackBoxTemplate(track)}, this.trackAddedKey);
              NotificationCenter.displayNotification(this.trackAddedKey, timeout);
          },
          hideAddedTrack() {
              NotificationCenter.hideNotification(this.trackAddedKey);
          },
      };

    JSPlayer.Notifications = {
        TracklistBrowserNotifications,
        PlayerNotifications,
        FileBrowserNotifications,
    }

})(this, document, this.JSPlayer);