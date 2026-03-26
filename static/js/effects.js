/* * Effects Module
 * Provides utility functions for visual effects such as fading elements in and out.
 * Utilizes the Web Animations API for smooth and efficient animations.
 * Designed to be reusable across different components of the application, such as notifications and track displays.
 * The Fader class includes methods for fading elements in and out, with customizable duration and opacity settings. It also includes a method to cancel ongoing animations, allowing for responsive interactions when users trigger multiple effects in quick succession.
 * Overall, this module enhances the user experience by providing visually appealing transitions and effects, contributing to a polished and professional feel for the music player application.
 * The design allows for easy integration with other components and can be extended in the future to include additional types of effects as needed.
 * In summary, this module serves as a crucial component of the music player application, providing a robust and flexible system for managing visual effects across different contexts, ultimately enhancing the overall user experience.
 */

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

export {Fader};

