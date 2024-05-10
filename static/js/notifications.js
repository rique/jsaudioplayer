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

    JSPlayer.Notifications = {
        PlayerNotifications,
    }

})(this, document, this.JSPlayer);