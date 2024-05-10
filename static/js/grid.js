(function(window, document, JSPlayer, undefined) {

    const generateLoremText = JSPlayer.Utils.generateLoremText;
    const clearElementInnerHTML = JSPlayer.Utils.clearElementInnerHTML;
    const Cell = JSPlayer.HTMLItems.Cell;
    const SortableCell = JSPlayer.HTMLItems.SortableCell;
    const Row = JSPlayer.HTMLItems.Row;
    const SortableRow = JSPlayer.HTMLItems.SortableRow;
    const ListEvents = JSPlayer.ListEvents;
    const DragitManager = JSPlayer.DragitManager;

    const BaseColumn = function() {
        this.cells = [];
    };
    BaseColumn.prototype = {
        addCell(cell) {
            this.cells.push(cell);
        },
        getCells() {
            return this.cells;
        }
    }

    const IndexedColumn = function() {
        BaseColumn.call(this);
        this.columnIndex = 0;
        this.sortedCells = [];
        this.sortModes = {
            NONE: 0,
            ASC: 1,
            DESC: 2,
        }
        this._sortMode = this.sortModes.NONE;
    };
    IndexedColumn.prototype = {
        findCellsByIndex() {
            return this.cells.filter(cell => cell.getIndex() == this.columnIndex);
        },
        setIndex(index) {
            this.columnIndex = index;
        },
        getIndex() {
            return this.columnIndex;
        },
        getCells() {
            if (this.isSorted())
                return this.sortedCells;
            return this.cells;
        },
        sort() {
            this._updateSortMode();
            if (!this.isSorted()) {
                this.sortedCells = [];
                return this.cells;
            }
            this.sortedCells = this.getSortedColumnCell();
            return this.sortedCells;
        },
        getSortedColumnCell() {
            const reversed = this.isReversed();
            return [...this.cells].sort((c1, c2) => {
                if (c1.getParentItem().isHead())
                    return 0;
                const cnt1 = c1.innerContent();
                const cnt2 = c2.innerContent();
                if (cnt1 > cnt2) return reversed ? -1 : 1;
                if (cnt1 < cnt2) return reversed ? 1 : -1;
                return 0;
            });
        },
        isReversed() {
            return this._sortMode == this.sortModes.DESC;
        },
        isSorted() {
            return this._sortMode > this.sortModes.NONE;
        },
        _updateSortMode() {
            if (this._sortMode == this.sortModes.DESC)
                this._sortMode = this.sortModes.NONE;
            else
                this._sortMode++;
        }
    }

    const BaseGrid = function(parentCnt) {
        this.rows = [];
        this.parentCnt = parentCnt;
    };
    BaseGrid.prototype = {
        getRows() {
            return this.rows;
        },
        setHead(row) {
            this.head = row;
        },
        addRow(row) {
            this.rows.push(row);
        },
        getParentCnt() {
            return this.parentCnt;
        },
        render() {
            clearElementInnerHTML(this.parentCnt);
            if (this.head)
                this.parentCnt.append(this.head.render());
            this.rows.forEach(row => this.parentCnt.append(row.render()));
        }
    }

    const SortableGrid = function(parentCnt) {
        BaseGrid.call(this, parentCnt);
        this.indexedColumns = {};
        this.eventsList = new ListEvents();
    };
    SortableGrid.prototype = {
        addRow(row) {
            row.setGrid(this);
            row.onIndexUpdate(this.reindexGrid.bind(this), this);
            BaseGrid.prototype.addRow.call(this, row);
        },
        getColumnByIndex(colIndex) {
            if (!this.indexedColumns.hasOwnProperty(colIndex)) {
                const column = new IndexedColumn();
                for (let i = 0; i < this.rows.length; ++i) {
                    let row = this.rows[i];
                    if (this.head && row.isHead())
                        continue;
                    column.addCell(row.getCellByIndex(colIndex));
                }
                column.setIndex(colIndex);
                this.indexedColumns[colIndex] = column;
            }
            
            return this.indexedColumns[colIndex];
        },
        sortGridByColumnIndex(colIndex) {
            const indexedColumn = this.getColumnByIndex(colIndex);
            this.rows = [];
            const sortedCells = indexedColumn.sort();
            
            for (let i = 0; i < sortedCells.length; ++i) {
                this.rows.push(sortedCells[i].getParentItem());
            }
            this.eventsList.trigger('onSortedGrid', indexedColumn.isSorted(), indexedColumn.isReversed());
            this.render();
        },
        sortGridByCell(cell) {
            cell.sort();
            const colIndex = cell.getIndex();
            const reversed = cell.isReversed();
            const isSorted = cell.isSorted();

            if (isSorted)
                this._sortGrid(colIndex, reversed)

            this.eventsList.trigger('onSortedGrid', isSorted, reversed);
            this.render(isSorted);
        },
        onSortedGrid(cb, subscriber) {
            this.eventsList.onEventRegister({cb, subscriber}, 'onSortedGrid');
        },
        reindexGrid(newIdx, oldIdx, row) {
            this.rows.splice((oldIdx - 1), 1);
            
            for (let i = 0; i < this.rows.length; ++i) {
                let r = this.rows[i],
                    idx = r.getIndex();
                
                if (oldIdx > newIdx && oldIdx > idx && idx >= newIdx) {
                    r.setIndex(idx + 1)
                } else if (newIdx > oldIdx && newIdx >= idx && idx > oldIdx) {
                    r.setIndex(idx - 1)
                }
            }
            
            this.rows.splice((newIdx - 1), 0, row);
            Object.keys(this.indexedColumns).forEach(colIndex => this.indexedColumns[colIndex] = this.getColumnByIndex(colIndex));
            this.render();
        },
        render(sorted) {
            clearElementInnerHTML(this.parentCnt);
            if (this.head)
                this.parentCnt.append(this.head.render());
            
            let rows = this.rows;
            
            if (sorted)
                rows = this.sortedRows;

            rows.forEach(row => this.parentCnt.append(row.render()));
        },
        _sortGrid(colIndex, reversed) {
            const type = this.head.getCellByIndex(colIndex).getType();
            this.sortedRows = [...this.rows].sort((row1, row2) => {
                if (row1.isHead())
                    return 0;
                const cnt1 = type && type == 'int' ? parseInt(row1.getCellByIndex(colIndex).innerContent()) : row1.getCellByIndex(colIndex).innerContent();
                const cnt2 = type && type == 'int' ? parseInt(row2.getCellByIndex(colIndex).innerContent()) : row2.getCellByIndex(colIndex).innerContent();

                if (cnt1 > cnt2) return reversed ? -1 : 1;
                if (cnt1 < cnt2) return reversed ? 1 : -1;
                return 0;
            });
        }
    }

    Object.setPrototypeOf(IndexedColumn.prototype, BaseColumn.prototype);
    Object.setPrototypeOf(SortableGrid.prototype, BaseGrid.prototype);

    const GridMaker = function(parentCnt, sortable) {
        this.rows = [];
        this.sortable = sortable;
        if (sortable) {
            this.grid = new SortableGrid(parentCnt);
            this.grid.onSortedGrid(this._onSortedGrid.bind(this));
        } else {
            this.grid = new BaseGrid(parentCnt);
        }

    };
    GridMaker.prototype = {
        setRows(rows) {
            for (let i = 0; i < rows.length; ++i) {
                this.makeRow(rows[i]);
            }
        },
        setDraggable(draggable, byCell) {
            this.draggable = draggable;
            this.byCell = byCell;
        },
        isDraggable() {
            return this.draggable;
        },
        undragGrid() {
            this._unsetDraggableGrid();
        },
        makeRowIdx(cells, autoWidth, head, idx) {
            let row;
            if (this.sortable)
                row = new SortableRow(head);
            else
                row = new Row(head);
            const nbCells = cells.length;

            let percentage;
            if (autoWidth) {
                let parentCnt = this.grid.getParentCnt();
                percentage = (parentCnt.clientWidth / nbCells) / (parentCnt.clientWidth / 100);
            }

            for (let i = 0; i < nbCells; ++i) {
                let c = cells[i];
                let cell;
                if (this.sortable && row.isHead() && c.sorterCell) {
                    cell = new SortableCell(c.type);
                    cell.addEventListener('click', this.grid.sortGridByCell.bind(this.grid, cell));
                } else
                    cell = new Cell();
                
                if (c.hasOwnProperty('width'))
                    cell.width(c.width, c.unit);
                else if (autoWidth)
                    cell.width(percentage, '%');

                if (c.hasOwnProperty('height'))
                    cell.height(c.height, c.unit);
                if (c.hasOwnProperty('editable') && c.editable)
                    cell.setEditable(c.editable, c.onEdit, c.onValidate);
                if (c.hasOwnProperty('draggable') && this.byCell && !row.isHead()) {
                    cell.setDraggable(c.draggable);
                    cell.onDragged(c.onDragged);
                    cell.onDropped(c.onDropped);
                }
                
                if (c.type && c.type == 'str' && c.content.trim() == '')
                        c.content = '&nbsp;'

                cell.innerContent(c.content);

                if (c.textAlign)
                    cell.textAlign(c.textAlign);

                row.addCell(cell);
            }

            if (!this.byCell && !row.isHead())
                row.setDraggable(this.draggable);

            if (this.sortable)
                row.setIndex(idx);
            
            if (row.isHead())
                this.grid.setHead(row);
            else
                this.grid.addRow(row);
        },
        render() {
            this.grid.render();
            if (this.isDraggable())
                this._setDraggableGrid();
        },
        getDraggableRows() {
            return this.grid.getRows().filter(r => r.isDraggable());
        },
        getDraggableCells() {
            const cells = [];
            const rows = this.grid.getRows();
            for (let i = 0; i < rows.length; ++i) {
                let row = rows[i];
                cells.push(...row.getCells().filter(c => c.isDraggable()))
            }
            return cells;
        },
        _onSortedGrid(isSorted) {
            if (isSorted) {
                this._unsetDraggableGrid();
            } else {
                this._setDraggableGrid();
            }
        },
        _setDraggableGrid() {
            if (!this.dragitManager)
                this.dragitManager = new DragitManager();
            if (!this.byCell)
                this.dragitManager.activate(this.getDraggableRows());
            else
                this.dragitManager.activate(this.getDraggableCells(), true);
        },
        _unsetDraggableGrid() {
            if (!this.dragitManager)
                return;
            this.dragitManager.deactivate();
        }
    }

    const demo = (divId) => {
        const gridMaker = new GridMaker(document.getElementById(divId), true);

        const nbRows = 35;
        const nbCells = 11;
        const letters = ["1", '2', '3', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'];
        gridMaker.setDraggable(true, true);

        for (let i = 0; i < nbRows; ++i) {
            let cells = [];
            for (let y = 0; y < nbCells; ++y) {
                cells.push({
                    content: i == 0 && y == nbCells - 1 ? 'Drag them!!' : y == nbCells - 1 ? 'Drag me!!' : generateLoremText(1, 6),
                    sorterCell: i == 0 && y < nbCells - 1,
                    unit: 'px',
                    editable: y < nbCells - 1 && i > 0 && y % 2 != 0,
                    onEdit: (evt) => {
                        console.log('editing!', evt);
                    },
                    onValidate: (evt, value) => {
                        console.log('validate value', value);
                    },
                    draggable: y == nbCells - 1 && i > 0,
                    onDragged: (evt) => {
                        evt.detail.HTMLItem.innerContent('Drop me!!');
                    },
                    onDropped: (evt) => {
                        evt.detail.HTMLItem.innerContent('Drag me!!');
                    }
                });
            }
            gridMaker.makeRowIdx(cells, true, i == 0, i);
        }

        gridMaker.render();
    };

   JSPlayer.GridMaker = GridMaker;

})(this, document, this.JSPlayer);