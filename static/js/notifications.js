(function(window, document, JSPlayer, undefined) {
    const NotificationCenter = JSPlayer.NotificationCenter;
    const TrackBoxTemplate = JSPlayer.NotificationTemplates.TrackBoxTemplate;

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
        PlayerNotifications,
        FileBrowserNotifications,
    }

})(this, document, this.JSPlayer);