(function(window, document, JSPlayer, undefined) {

    const ListEvents = JSPlayer.EventsManager.ListEvents;
    const getLastParent = JSPlayer.Utils.getLastParent;

    const getOffsetLeft = (elem) => {
        let offset = 0;
        while (elem.parentElement) {
                offset += elem.parentElement.offsetLeft;
                elem = elem.parentElement;
        }
        return offset;
    }
 
     const getOffsetTop  = (elem) => {
         const bounds = elem.getBoundingClientRect();
         return bounds.top;
     }
 
     const getOffsetBottom  = (elem) => {
         const bounds = elem.getBoundingClientRect();
         return bounds.bottom;

     }

    const HTMLItems = function(elementName) {
        this.element = document.createElement(elementName);
        this.events = {};
        this.eventsHandler = {};
    };
    HTMLItems.prototype = {
        render(getReal) {
            return this.seekParent && !getReal ? this.getParent() : this.element;
        },
        setSeekParent() {
            this.seekParent = true;
        },
        unsetSeekParent() {
            this.seekParent = false;
        },
        getParent() {
            return this.element.parentElement;
        },
        offsetParent() {
            return this.render().offsetParent;
        },
        setParentItem(htmlItem) {
            this.parentItem = htmlItem;
        },
        getParentItem() {
            return this.parentItem;
        },
        id(id) {
            if (!id) {
                return this.render().id;
            }
            this.render().id = id;
        },
        width(width, unit) {
            if (typeof width === 'number')
                this.css({width:`${width}${unit}`});
            else
                return this.render().style.width;
        },
        height(height, unit) {
            if (typeof height === 'number')
                this.render().style.height = `${height}${unit}`;
            else
                return this.render().style.height;
        },
        left(left, unit) {
            if (typeof left === 'number')
                this.render().style.left = `${left}${unit}`;
            else
                return this.render().style.left;
        },
        top(top, unit) {
            if (typeof top === 'number')
                this.render().style.top = `${top}${unit}`;
            else
                return this.render().style.top;
        },
        offsetTop(doMargin) {
            let margin = 0;
            if (doMargin) {
                return getOffsetTop(this.render());
            }
            return this.render().offsetTop + margin;
        },
        offsetLeft(doMargin) {
            let margin = 0;
            if (doMargin) {
                margin = getOffsetLeft(this.render());
            }
            return this.render().offsetLeft + margin;
        },
        offsetRight(doMargin) {
            let margin = 0;
            if (doMargin) {
                margin = getOffsetLeft(this.render());
            }
            return this.render().offsetLeft + this.render().offsetWidth + margin;
        },
        offsetBottom(doMargin, depth) {
            let margin = 0;
            if (doMargin) {
                return getOffsetBottom(this.render(), depth);
            }
            return this.render().offsetTop + this.render().offsetHeight + margin;
        },
        offsetWidth() {
            return this.render().offsetWidth;
        },
        offsetHeight() {
            return this.render().offsetHeight;
        },
        setLeftTop(left, top) {
            this.render().style.left = `${left}px`;
            this.render().style.top = `${top}px`;
        },
        scrollTop(parentElem) {
            parentElem = parentElem || getLastParent(this.render(), 0);
            return parentElem.scrollTop;
        },
        scrollLeft(parentElem) {
            parentElem = parentElem || getLastParent(this.render(), 0);
            return parentElem.scrollLeft;
        },
        scrollTo(parentElem) {
            parentElem = parentElem || getLastParent(this.render(), 0);
            const scrollTo = this.offsetTop() - this.offsetHeight();
            setTimeout(() => {
                parentElem.scrollTo({
                    behavior: 'smooth',
                    left: 0,
                    top: scrollTo,
                })
            }, 0);
        },
        innerContent(content) {
            if (typeof content !== 'undefined')
                this.render(true).innerHTML = content;
            else
                return this.render(true).innerHTML;
        },
        append(...elements) {
            this.render().append(...elements.map(el => el.render()));
        },
        remove() {
            this.render().remove();
        },
        show() {
            this.css({display: 'block'}, true);
        },
        hide() {
            this.css({display: 'none'}, true);
        },
        classAdd(className) {
            this.render().classList.add(className);
        },
        classRemove(className) {
            this.render().classList.remove(className);
        },
        classReplace(className, replaceWith) {
            this.render().classList.replace(className, replaceWith);
        },
        classToggle(className) {
            this.render().classList.toggle(className);
        },
        setClassName(className) {
            this.render().className = className;
        },
        css(style, replace) {
            style = style || {};
            if (!replace)
                style = {...this.render().style, ...style};

            Object.keys(style).forEach(k => this.render().style[k] = style[k]);
        },
        data(name, value) {
            const isName = typeof name !== 'undefined';
            const isValue = typeof value !== 'undefined'
            if (isName && isValue) {      
                this.render().dataset[name] = value;
            } else if (isName)
                return this.render().dataset[name];
            else
                return this.render().dataset;
        },
        insertItemAfter(htmlItem) {
            htmlItem.render().insertAdjacentElement('afterend', this.render());
        },
        addEventListener(evtName, cb) {
            if (!this.eventsHandler.hasOwnProperty(evtName)) {
                this.eventsHandler[evtName] = [];
            }
            //const idx = this.eventsHandler[evtName].findIndex(evts => evts.evtName == evtName && evts.node == this);
            this.eventsHandler[evtName].push({
                node: this, evtName, cb
            });

            this.render().addEventListener(evtName, cb, false);
        },
        removeEventListener(evtName, cb) {
            this.render().removeEventListener(evtName, cb);
        },
        clearAllEvents() {
            Object.keys(this.eventsHandler)
                .forEach(key => this.eventsHandler[key]
                    .filter(evts => evts.node == this)
                    .forEach(evts => this.removeEventListener({evts})));
        },
        createCustomEvent(evtName, options) {
            if (this.events.hasOwnProperty(evtName))
                return console.error(`Event ${evtName} already set`);

            options = options || {detail: {HTMLItem: this}, bubbles:false};
            
            this.events[evtName] = new CustomEvent(evtName, options);
        },
        dispatchEvent(evtName) {
            if (!this.events.hasOwnProperty(evtName))
                return console.error(`Unknown event name ${evtName}`);
            
            this.render().dispatchEvent(this.events[evtName]);
        },
    }

    const HTMLIndexedItems = function(elementName) {
        HTMLItems.call(this, elementName);
        this.index = 0;
        this.eventsList = new ListEvents();
    };
    HTMLIndexedItems.prototype = {
        setIndex(index) {
            this.index = index;
            this.data('index', index);
        },
        updateIndex(index) {
            this.eventsList.trigger('onIndexUpdate', index, this.index, this);
            this.setIndex(index);
        },
        getIndex() {
            return this.index;
        },
        onIndexUpdate(cb, subscriber) {
            this.eventsList.onEventRegister({cb, subscriber}, 'onIndexUpdate');
        },
        insertItemAfter(htmlItem) {
            let htmlItemIndex = htmlItem.getIndex();
            if (this.index > htmlItemIndex)
                htmlItemIndex++;
            this.updateIndex(htmlItemIndex);
            htmlItem.render().insertAdjacentElement('afterend', this.render());
        },
        
    }

    const HTMLDraggableItems = function(elementName) {
        HTMLIndexedItems.call(this, elementName);
        this._setupEvents();
    }
    HTMLDraggableItems.prototype = {
        toggleHovered() {
            this.classToggle('hovered')
        },
        setDraggable(draggable) {
            if (draggable)
                this.classAdd('draggable');
            else
                this.classRemove('draggable');
            this.draggable = draggable;
        },
        isDraggable() {
            return this.draggable;
        },
        onDragged(cb) {
            this.addEventListener('dragged', cb);
        },
        onDropped(cb) {
            this.addEventListener('dropped', cb);
        },
        init(seekParent) {
            if (!this.element)
                return false;

            if (seekParent)
                this.setSeekParent();

            this.css({
                position: 'absolute',
                left: `${this.offsetLeft()}px`,
                top: `${this.offsetTop()}px`,
                zIndex: 100,
            });

            this.render().classList.replace('dropped', 'dragged');

            return true;
        },
        reset() {
            this.css({
                position: 'static',
            });

            const droppedAnimation = new DroppedAnimation(this.render());
            
            droppedAnimation.start(790, (element) => {
                element.classList.replace('dragged', 'dropped');
            });

            if (this.seekParent)
                this.unsetSeekParent();
        },
        dispatchEvent(evtName) {
            if (!this.events.hasOwnProperty(evtName))
                return console.error(`Unknown event name ${evtName}`);
            
            this.render(true).dispatchEvent(this.events[evtName]);
        },
        _setupEvents() {
            this.createCustomEvent('dragged');
            this.createCustomEvent('dropped');
        }
    }

    Object.setPrototypeOf(HTMLIndexedItems.prototype, HTMLItems.prototype);
    Object.setPrototypeOf(HTMLDraggableItems.prototype, HTMLIndexedItems.prototype);

    const DroppedAnimation = function(element) {
        this.element = element;
    }
    DroppedAnimation.prototype = {
        start(timeout, onFinish) {
            timeout = timeout || 1000;
            const animation = this._setupDroppedAnimation(this.element, timeout);
            animation.onfinish = () => {
                if (typeof onFinish == 'function')
                    onFinish(this.element);
            };

            animation.play();
        },
        _setupDroppedAnimation(element, timeout) {
            let elementBGColor = element.style.background;
            
            if (!elementBGColor) {
                let computedStyle = window.getComputedStyle(element);
                elementBGColor = computedStyle.getPropertyValue('background-color')
                if (!elementBGColor)
                    elementBGColor = computedStyle.getPropertyValue('background');
                if (!elementBGColor)
                    elementBGColor = 'inherit';
            }
            
            const keyFrames = [
                {background: elementBGColor, fontSize: '0.25em'},
                {background: '#e5fce8', fontSize: '0.25em'},
                {background: '#e5fce8', fontSize: '0.25em'},
                {background: elementBGColor, fontSize: '0.27em'},
                {fontSize: '0.3em'}
            ];
            
            const kfEffect = new KeyframeEffect(element, keyFrames, {
                duration: timeout,
            });

            return new Animation(kfEffect, document.timeline);
        }
    }

    const EditInput = function() {
        HTMLItems.call(this, 'input');
        this.render().setAttribute('type', 'text');
    };
    EditInput.prototype = {
        hidden(hidden) {
            if (hidden) {
                this.isHidden = true;
                this.render().setAttribute('type', 'hidden');
            } else {
                this.isHidden = false;
                this.render().setAttribute('type', 'text');
            }
        },
        value(value) {
            if (value)
                this.render().value = value;
            else
                return this.render().value;
        },
        blur() {
            this.render().blur();
        },
        focus() {
            this.render().focus();
        },
        select() {
            this.render().select();
        },
        onBlur(cb) {
            this.addEventListener('blur', cb);
        },
        onFocus(cb) {
            this.addEventListener('focus', cb);
        }
    }

    const Cell = function() {
        HTMLDraggableItems.call(this, 'div');
        this.setupCell();
    }
    Cell.prototype = {
        setupCell() {
            this.classAdd('cell');
            this.createCustomEvent('myClick');
            this.addEventListener('click', () => {
                this.dispatchEvent('myClick');
            });
        },
        setEditable(editable, onEdit, onValidate) {
            this.onEdit(onEdit, onValidate);
            this.classAdd('editable');
            this.editable = editable;
        },
        isEditable() {
            return this.editable;
        },
        onEdit(onEdit, onValidate) {
            this.onClick(evt =>  this._edit(evt, onEdit, onValidate));
        },
        onClick(cb) {
            this.addEventListener('myClick', cb);
        },
        setSearchable(searchable) {
            this.searchable = searchable;
        },
        isSearchable() {
            return this.searchable;
        },
        textAlign(textAlign) {
            this.css({textAlign});
        },
        toObject() {
            return {
                element: this.render(),
                innerContent: this.innerContent(),
                index: this.getIndex(),
            }
        },
        _edit(evt, onEdit, onValidate) {
            if (this.isEditing)
                return;

            this.isEditing = true;
            this.input = new EditInput();
            this.hidden = new EditInput();
            this.input.hidden(false);
            this.hidden.hidden(true);
            this.input.onBlur(evt => this._validate(evt, onValidate));
            this.input.addEventListener('keydown', evt => evt.key === 'Enter' && this._validate(evt, onValidate));
            
            this.input.value(this.innerContent());
            this.hidden.value(this.innerContent());
            this.innerContent('');
            this.append(this.input, this.hidden);
            this.input.focus();
            this.input.select();
            onEdit(evt);
        },
        _validate(evt, cb) {
            if (!this.isEditing)
                return;

            cb(evt, this, this.input.value(), this.hidden.value());
            this.isEditing = false;
        }

    };

    const SortableCell = function(type) {
        Cell.call(this);
        this.sorted = false;
        this.reversed = false;
        this.sortModes = {
            NONE: 0,
            ASC: 1,
            DESC: 2,
        }
        this._sortMode = this.sortModes.NONE;
        this._type = type;
        this.onSortedCell(this.switchSortedClass.bind(this), this);
    };
    SortableCell.prototype = {
        getType() {
            return this._type;
        },
        setType(type) {
            this._type = type;
        },
        setupCell() {
            this.classAdd('sortable');
            Cell.prototype.setupCell.call(this);
        },
        isReversed() {
            return this._sortMode == this.sortModes.DESC;
        },
        isSorted() {
            return this._sortMode > this.sortModes.NONE;
        },
        sort() {
            this._updateSortMode();
            this.eventsList.trigger('onSortedCell', this);
        },
        reset() {
            this._sortMode = this.sortModes.NONE;
            this.eventsList.trigger('onSortedCell', this);
        },
        onSortedCell(cb, subscriber) {
            this.eventsList.onEventRegister({cb, subscriber}, 'onSortedCell');
        },
        switchSortedClass(cell) {
            switch (cell._sortMode) {
                case this.sortModes.NONE:
                    cell.classRemove('sorted');
                    break;
                case this.sortModes.ASC:
                case this.sortModes.DESC:
                    cell.getParentItem().clearSortedCells();
                    cell.classAdd('sorted');
                    break;
            }
        },
        toObject() {
            const cellData = {
                sorted: this.sorted,
                reversed: this.reversed,
                index: this.getIndex(),
                sortMode: this._sortMode,
            }
            return {...Cell.prototype.toObject.call(this), ...cellData}
        },
        _updateSortMode() {
            if (this._sortMode == this.sortModes.DESC)
                this._sortMode = this.sortModes.NONE;
            else
                this._sortMode++;
        }
    };

    const Row = function(head) {
        HTMLDraggableItems.call(this, 'div');
        this.cells = [];
        this._isHead = head;
        this.setupRow();
    };
    Row.prototype = {
        setupRow() {
            let className;
            if (this._isHead)
                className = 'head';
            else
                className = 'lonely';
            this.element.classList.add('row', className, 'dropped');
        },
        setGrid(grid) {
            this.grid = grid;
        },
        getGrid() {
            return this.grid;
        },
        addCell(cell) {
            cell.setParentItem(this);
            this.cells.push(cell);
        },
        isHead() {
            return this._isHead;
        },
        render(getReal) {
            if (!this.applied || this.cells.length == 0)
                this.appendCells();
            return HTMLDraggableItems.prototype.render.call(this, getReal);
        },
        appendCells() {
            this.applied = true;
            this.append(...this.cells);
        },
        getCells() {
            return this.cells;
        },
        getSearchableCells() {
            return this.cells.filter(c => c.isSearchable());
        },
        toObject() {
            const cellList = [];
            for (let i = 0; i < this.cells.length; ++i) {
                cellList.push(this.cells[i].toObject())
            }

            return {isHead: !!this._isHead, cellList};
        }
        
    };

    const SortableRow = function(head) {
        Row.call(this, head);
    };
    SortableRow.prototype = {
        getCellByIndex(cellIndx) {
            return this.cells[cellIndx];
        },
        addCell(cell) {
            cell.setIndex(this.cells.length);
            Row.prototype.addCell.call(this, cell);
        },
        clearSortedCells() {
            this.cells.forEach(cell => cell.classRemove('sorted'));
        }
    };

    Object.setPrototypeOf(Row.prototype, HTMLDraggableItems.prototype);
    Object.setPrototypeOf(Cell.prototype, HTMLDraggableItems.prototype);
    Object.setPrototypeOf(EditInput.prototype, HTMLItems.prototype);
    Object.setPrototypeOf(SortableCell.prototype, Cell.prototype);
    Object.setPrototypeOf(SortableRow.prototype, Row.prototype);

    JSPlayer.HTMLItems = {
        HTMLItems,
        EditInput,
        Cell,
        Row,
        SortableCell,
        SortableRow,
    }

})(this, document, this.JSPlayer);