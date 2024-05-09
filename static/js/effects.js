(function(window, document, undefined) {

    window.JSPlayer = window.JSPlayer || {};

    const Fader = function() {}; 
    Fader.prototype = {
        fadeIn(elem, duration=500, startOpacity=0, maxOpacity=1, whenDone, ...args) {
            this._fade(elem, duration, startOpacity, maxOpacity, false, whenDone, ...args);
        },
        fadeOut(elem, duration=500, startOpacity=1, minOpacity=0, whenDone, ...args) {
            this._fade(elem, duration, startOpacity, minOpacity, true, whenDone, ...args);
        },
        cancelFade() {
            if (this._animation) {
                this._animation.cancel();
            }
        },
        _fade(elem, duration, start, end, isFadingOut, whenDone, ...args) {
            if (!isFadingOut && elem.style.display == 'none')
                elem.style.display = 'block';

            const keyFrames = [{opacity: start}, {opacity: end}];
            const kfEffect = new KeyframeEffect(elem, keyFrames, {
                duration,
            });
            
            this._animation = new Animation(kfEffect, document.timeline);
            this._animation.play();
            
            this._animation.onfinish = () => {
                if (isFadingOut)
                    elem.style.display = 'none';
                
                if (typeof whenDone === 'function')
                    whenDone(elem, ...args);

                this._animation = null;
            };
            
            if (typeof whenDone === 'function') {
                this._animation.oncancel = () => {
                    whenDone(elem, ...args);
                    this._animation = null;
                };
            }
        }
    };

    window.JSPlayer.Effects = {Fader};

})(this, document);