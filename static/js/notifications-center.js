/* * Notifications Center Module
 * Provides a centralized system for managing and displaying notifications within the application.
 * Supports different notification levels (info, warning, error) and allows for dynamic content updates.
 * Utilizes a templating system for consistent notification styling and behavior.
 * Integrates with the Fader class for smooth fade-in and fade-out animations of notifications.
 * The NotificationCenter object allows for registering, modifying, displaying, and hiding notifications using unique keys.
 * Each notification is rendered using the NotificationRenderer class, which handles the creation and animation of notification elements in the DOM.
 * The module also includes a TrackBoxTemplate for rendering track-related notifications with album art and metadata.
 * Overall, this module enhances the user experience by providing timely and informative feedback about various actions and states within the music player application.
 * The design allows for easy updates and additions to the notification system in the future, ensuring that the application can continue to provide relevant feedback as new features are introduced.
 * The module promotes code reusability and maintainability by centralizing notification management and allowing for dynamic content updates through the use of templates and asynchronous data handling.
 * In summary, this module serves as a crucial component of the music player application, providing a robust and flexible system for managing notifications across different contexts, ultimately enhancing the overall user experience.
 */
import {Fader} from './effects.js';
import {uuidv4} from './utils.js';

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
    async _setUpTplAsync(title, messagePromise, tplUUID, cb) {
        const message = await messagePromise;
        this._setUpTplSync(title, message, tplUUID, cb);
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

const TrackBoxTemplate = function(track) {
    this.track = track;
    this.imgId = `img-${uuidv4()}`;
};
TrackBoxTemplate.prototype = {
    render() {
        this._setUpTpl(this.track);
        return this._tpl;
    },
    _setUpTpl(track) {
        let album  = track.getAlbum() || 'N/A';
        let artist = track.getArtist() || 'N/A';

        this._tpl = `<div class="notif-logo"><img style="width: 100%" id="${this.imgId}" src="/static/albumart.svg"></div><div style="width: 80%; font-size: 14px;" class="notif-body inline-block"><p class="no-wrap">${track.getTitle()} ~ ${album}</p>
        <p class="no-wrap">${artist}</p></div>`;

        track.getAlbumArt().then((albumart) => {   
            const imgElem = document.getElementById(this.imgId);
            if (imgElem)
                imgElem.src = albumart;
        }).catch((err) => {
            console.error('Error fetching album art for notification', err);
        });
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
        this._fader.fadeOut(notificationBox, 400, +notificationBox.style.opacity, 0, this._removeNotificationBox.bind(this));
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

export {NotificationCenter, TrackBoxTemplate};