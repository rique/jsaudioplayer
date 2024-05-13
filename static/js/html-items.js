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
 
     const getOffsetBottom  = (elem, depth) => {
         const bounds = elem.getBoundingClientRect();
         return bounds.bottom;

     }

    const HTMLItems = function(elementName) {
        this.element = document.createElement(elementName);
        this.events = {};
    };
    HTMLItems.prototype = {
        render() {
            return this.element;
        },
        getParent() {
            return this.element.parentElement;
        },
        setParentItem(htmlItem) {
            this.parentItem = htmlItem;
        },
        getParentItem(htmlItem) {
            return this.parentItem;
        },
        width(width, unit) {
            if (typeof width === 'number')
                this.element.style.width = `${width}${unit}`;
            else
                return this.element.style.width;
        },
        height(height, unit) {
            if (typeof height === 'number')
                this.element.style.height = `${height}${unit}`;
            else
                return this.element.style.height;
        },
        left(left, unit) {
            if (typeof left === 'number')
                this.element.style.left = `${left}${unit}`;
            else
                return this.element.style.left;
        },
        top(top, unit) {
            if (typeof top === 'number')
                this.element.style.top = `${top}${unit}`;
            else
                return this.element.style.top;
        },
        offsetTop(doMargin) {
            let margin = 0;
            if (doMargin) {
                return getOffsetTop(this.element);
            }
            return this.element.offsetTop + margin;
        },
        offsetLeft(doMargin) {
            let margin = 0;
            if (doMargin) {
                margin = getOffsetLeft(this.element);
            }
            return this.element.offsetLeft + margin;
        },
        offsetRight(doMargin) {
            let margin = 0;
            if (doMargin) {
                margin = getOffsetLeft(this.element);
            }
            return this.element.offsetLeft + this.element.offsetWidth + margin;
        },
        offsetBottom(doMargin, depth) {
            let margin = 0;
            if (doMargin) {
                return getOffsetBottom(this.element, depth);
            }
            return this.element.offsetTop + this.element.offsetHeight + margin;
        },
        offsetWidth() {
            return this.element.offsetWidth;
        },
        offsetHeight() {
            return this.element.offsetHeight;
        },
        setLeftTop(left, top) {
            this.element.style.left = `${left}px`;
            this.element.style.top = `${top}px`;
        },
        scrollTop() {
            const parentElem = getLastParent(this.element, 0);
            return parentElem.scrollTop;
        },
        scrollLeft() {
            const parentElem = getLastParent(this.element, 0);
            return parentElem.scrollLeft;
        },
        innerContent(content) {
            if (typeof content !== 'undefined')
                this.render(true).innerHTML = content;
            else
                return this.render(true).innerHTML;
        },
        append(...elements) {
            this.element.append(...elements.map(el => el.render()));
        },
        classAdd(className) {
            this.element.classList.add(className);
        },
        setClassName(className) {
            this.element.className = className;
        },
        classRemove(className) {
            this.element.classList.remove(className);
        },
        classReplace(className, replaceWith) {
            this.element.classList.replace(className, replaceWith);
        },
        classToggle(className) {
            this.element.classList.toggle(className);
        },
        css(style, replace) {
            style = style || {};
            if (!replace)
                style = {...this.element.style, ...style};

            Object.keys(style).forEach(k => this.element.style[k] = style[k]);
        },
        data(name, value) {
            if (name && value) {      
                this.element.dataset[name] = value;
            } else if (name)
                return this.element.dataset[name];
            else
                return this.element.dataset;
        },
        insertItemAfter(itemInstance) {
            itemInstance.element.insertAdjacentElement('afterend', this.render());
        },
        addEventListener(evtName, cb) {
            this.element.addEventListener(evtName, cb);
        },
        createCustomEvent(evtName, options) {
            if (this.events.hasOwnProperty(evtName))
                return console.error(`Event ${evtName} already set`);

            options = options || {detail: {HTMLItem: this}};
            
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
        insertItemAfter(cellInstance) {
            let thisInstanceIdx = cellInstance.getIndex();
            if (this.index > thisInstanceIdx)
                thisInstanceIdx++;
            this.updateIndex(thisInstanceIdx);
            cellInstance.element.insertAdjacentElement('afterend', this.render());
        }
    }

    const HTMLDraggableItems = function(elementName) {
        HTMLIndexedItems.call(this, elementName);
        this._setupEvents();
    }
    HTMLDraggableItems.prototype = {
        render(getReal) {
            if (getReal && this.seekParent) {
                return this.element.querySelector('.draggable');
            }
            return this.element;
        },
        setSeekParent() {
            this.seekParent = true;
            this.element =  this.element.parentElement;
        },
        unsetSeekParent() {
            this.seekParent = false;
            this.element = this.element.querySelector('.draggable');
        },
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

            this.element.classList.add('dragged');

            return true;
        },
        reset() {
            this.css({
                position: 'static',
            });

            const droppedAnimation = new DroppedAnimation(this.element);
            
            droppedAnimation.start(790, (element) => {
                element.classList.remove('dragged');
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
    };
    EditInput.prototype = {
        hidden(hidden) {
            if (hidden) {
                this.isHidden = true;
                this.element.setAttribute('type', 'hidden');
            } else {
                this.isHidden = false;
                this.element.setAttribute('type', 'text');
            }
        },
        value(value) {
            if (value)
                this.element.value = value;
            else
                return this.element.value;
        },
        blur() {
            this.element.blur();
        },
        focus() {
            this.element.focus();
        },
        select() {
            this.element.select();
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
            this.addEventListener('click', cb);
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
        toObject() {
            return {
                element: this.element,
                innerContent: this.innerContent(),
                index: this.getIndex(),
            }
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
            this.element.classList.add('row', className);
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
        render() {
            if (!this.applied)
                this.appendCells();
            return this.element;
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
        EditInput,
        Cell,
        Row,
        SortableCell,
        SortableRow,
    }

})(this, document, this.JSPlayer);