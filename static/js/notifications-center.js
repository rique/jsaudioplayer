(function(window, document, JSPlayer, undefined) {
    const Fader = JSPlayer.Effects.Fader;
    const uuidv4 = JSPlayer.Utils.uuidv4;

    const NotificationMainBoxTemplate = {
        notifParentNode: document.getElementById('notifications-cnt'),
        render(title, message, cb) {
            const tplUUID = this._setUpTpl(title, message, (tplUUID) => {
                this._renderTpl();
                if (typeof cb === 'function')
                    cb(tplUUID);
            });
            
            return tplUUID;
        },
        _setUpTpl(title, message, cb) {
            const tplUUID = uuidv4();
            this._tpl = document.createElement('div');
            this._tpl.className = 'notification-box';
            this._tpl.style.display = 'none';
            this._tpl.dataset.tplId = tplUUID;
            if (message instanceof Promise)
                this._setUpTplAsync(title, message, tplUUID, cb)
            else 
                this._setUpTplSync(title, message, tplUUID, cb);
            return tplUUID;
        },
        _setUpTplSync(title, message, tplUUID, cb) {
            this._tpl.innerHTML = `
            <div class="notification-head">
                <div class="notif-title inline-block">
                    ${title}
                </div><div class="notif-close inline-block"><div class="close-cirlce "><i class="fa-solid fa-xmark"></i></div></div>
                </div>
                <div class="notification-message">
                ${message}
                </div>
                <div class="notification-timer">
                <div class="notif-prog-bar">
                    <div class="notif-sub-prog-bar"></div>
                </div>
            </div>`;

            if (typeof cb === 'function')
                cb(tplUUID);
    
        },
        _setUpTplAsync(title, message, tplUUID, cb) {
            message.then((msg) => {
                this._tpl.innerHTML = `
                <div class="notification-head">
                    <div class="notif-title inline-block">
                        ${title}
                    </div><div class="notif-close inline-block"><div class="close-cirlce "><i class="fa-solid fa-xmark"></i></div></div>
                    </div>
                    <div class="notification-message">
                    ${msg}
                    </div>
                    <div class="notification-timer">
                    <div class="notif-prog-bar">
                        <div class="notif-sub-prog-bar"></div>
                    </div>
                </div>`;

                if (typeof cb === 'function')
                    cb(tplUUID);
            });
        },
        _renderTpl() {
            this.notifParentNode.prepend(this._tpl);
        }
    };
    
    
    const BoxTemplateBase = function() {};
    BoxTemplateBase.prototype = {
        render() {
            return this._tpl;
        },
        toString() {
            return this.render();
        }
    }
    
    TrackBoxTemplate = function(track) {
        this.track = track;
    };
    TrackBoxTemplate.prototype = {
        async render() {
            await this._setUpTpl(this.track);
            return this._tpl;
        },
        async _setUpTpl(track) {
            let album  = track.getAlbum();
            let artist = track.getArtist();
            
            if (!artist || artist.length == 0)
                artist = 'N/A';
            if (!album || album.length == 0)
                album = 'N/A';
    
            const albumart = await track.getAlbumArt();
            let data, format, imgSrc;
            
            if (albumart) {
                ({data, format} = albumart);
            }
    
            if (!data || data.length == 0) {
                imgSrc = "/static/albumart.jpg";
            } else {
                imgSrc = `data:${format};base64,${data}`;
            }
    
            this._tpl = `<div class="notif-logo"><img style="width: 100%" src="${imgSrc}"></div><div style="width: 80%; font-size: 14px;" class="notif-body inline-block"><p class="no-wrap">${track.getTitle()} ~ ${album}</p>
            <p class="no-wrap">${artist}</p></div>`;
        },
    };
    
    
    Object.setPrototypeOf(TrackBoxTemplate.prototype, BoxTemplateBase.prototype);
    
    const NotificationRenderer = function() {
        this._notificationMainBoxTemplate = NotificationMainBoxTemplate;
        this.defaultTimeout = 5000;
        this._fader = new Fader();
    };
    NotificationRenderer.prototype = {
        render(notification, timeout) {
            timeout = timeout || this.defaultTimeout;
            const tplUUID = this._notificationMainBoxTemplate.render(notification.getTitle(), notification.getMessage(), (tplUUID) => {
                const notificationBox = document.querySelector(`[data-tpl-id="${tplUUID}"]`);
                const notifSubProgBar = document.querySelector(`[data-tpl-id="${tplUUID}"] .notif-prog-bar .notif-sub-prog-bar`);
                const animation = this._setUpAnimation(timeout, notifSubProgBar);
                notificationBox.addEventListener('click', this.close.bind(this, animation));
                this._displayNotificationBox(notificationBox, animation);
            });
            return tplUUID;
        },
        close(animation) {
            if (animation)
                animation.finish();
        },
        remove(tplUUID) {
            const notificationBox = document.querySelector(`[data-tpl-id="${tplUUID}"]`);
            if (notificationBox)
                this._hideAndRemoveNotificationBox(notificationBox);
        },
        _displayNotificationBox(notificationBox, animation) {
            this._fader.fadeIn(notificationBox, 250);
            animation.play();
            animation.onfinish = this._hideAndRemoveNotificationBox.bind(this, notificationBox);
        },
        _hideAndRemoveNotificationBox(notificationBox) {
            this._fader.fadeOut(notificationBox, 400, notificationBox.style.opacity, 0, this._removeNotificationBox.bind(this));
        },
        _removeNotificationBox(notificationBox) {
            notificationBox.remove();
        },
        _setUpAnimation(timeout, notifSubProgBar) {
            const keyFrames = [{width: '100%'}, {width: '0%'}];
            const kfEffect = new KeyframeEffect(notifSubProgBar, keyFrames, {
                duration: timeout,
            });
            return new Animation(kfEffect, document.timeline);
        }
    };
    
    const Notification = function(title, message, level) {
        this.title = title;
        this.message = message;
        this.level = level;
        this._notificationRenderer = new NotificationRenderer();
    };
    Notification.prototype = {
        getTitle() {
            return this.title;
        },
        setTitle(title) {
            this.title = title;
        },
        getMessage() {
            return this.message;
        },
        setMessage(message) {
            this.message = message;
        },
        getLevel() {
            return this.level;
        },
        setLevel(level) {
            this.level = level;
        },
        render(timeout) {
            this.tplUUID = this._notificationRenderer.render(this, timeout);
        },
        hide() {
            this._notificationRenderer.remove(this.tplUUID);
        }
    };
    
    const NotificationCenter = {
        notifications: {},
        registerNotification({title, message, level}, key) {
            if (this.notifications.hasOwnProperty(key))
                return console.error(`Notification key ${key} already set`);
            this._createNotification(title, message, level, key);
        },
        unregisterNotification(key) {
            if (!this.notifications.hasOwnProperty(key))
                return console.error(`Notification key ${key} not set, doing nothing`);
            this._deleteNotification(key);
        },
        modifyNotification({title, message, level}, key) {
            if (!this.notifications.hasOwnProperty(key))
                return console.error(`Notification key ${key} does not exists`);
            this._updateNotification(title, message, level, key);
        },
        displayNotification(key, timeout) {
            if (!this.notifications.hasOwnProperty(key))
                return console.error(`Notification key ${key} does not exists`);
            this.notifications[key].render(timeout);
        },
        hideNotification(key) {
            if (!this.notifications.hasOwnProperty(key))
                return console.error(`Notification key ${key} does not exists`);
    
            this.notifications[key].hide();
        },
        _createNotification(title, message, level, key) {
            this.notifications[key] = new Notification(title, message, level);
        },
        _updateNotification(title, message, level, key) {
            const notification = this.notifications[key];
            if (typeof title !== 'undefined')
                notification.setTitle(title);
            if (typeof message !== 'undefined')
                notification.setMessage(message);
            if (typeof level !== 'undefined')
                notification.setLevel(level);
        },
        _deleteNotification(key) {
            delete this.notifications[key];
        },
    };

    window.JSPlayer.NotificationCenter = NotificationCenter;
    window.JSPlayer.NotificationTemplates = {
        TrackBoxTemplate
    }

})(this, document, this.JSPlayer);