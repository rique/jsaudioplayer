(function(window, document, JSPlayer, undefined) {
    const LeftMenu = function() {};
    LeftMenu.prototype = {
        init() {
            this.mainMenuElem = document.getElementById('main-left-menu');
            this.openMenuElem = document.getElementById('open-menu');
            this.leftMenuElement = document.getElementById('left-menu');
            this.openMenuElem.addEventListener('click', this.openClose.bind(this));
        },
        openClose() {
            if (this.mainMenuElem.classList.contains('is-open')) {
                this.close();
            } else {
                this.open();
            }
            this.mainMenuElem.classList.toggle('is-open');
        },
        open() {
            let maxRight = 0 - 1;
            let start = -(this.leftMenuElement.offsetWidth);
            let step = 30;
            this._slide.bind(this)(start, maxRight, step, this.mainMenuElem, 'right');
        },
        close() {
            let maxRight = -(this.leftMenuElement.offsetWidth) + 1;
            let start = 0;
            let step = -30;
            this._slide.bind(this)(start, maxRight, step, this.mainMenuElem, 'left');
        },
        _slide(start, maxRight, step, mainMenuElem, direction) {
            direction = direction || 'right';
            if ((start <= maxRight && direction == 'right') || (start >= maxRight && direction == 'left')) {
                if ((start > maxRight && direction == 'right') || (start < maxRight && direction == 'left'))
                    start = maxRight + 1;
                else
                    start += step;
                mainMenuElem.style.right = `${start}px`;
                requestAnimationFrame(this._slide.bind(this, start, maxRight, step, mainMenuElem, direction))
            }
        },
    };

    JSPlayer.Components = {
        LeftMenu,
    }

})(this, document, this.JSPlayer);