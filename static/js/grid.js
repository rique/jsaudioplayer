(function(window, document, JSPlayer, undefined) {

    const clearElementInnerHTML = JSPlayer.Utils.clearElementInnerHTML;
    const Cell = JSPlayer.HTMLItems.Cell;
    const SortableCell = JSPlayer.HTMLItems.SortableCell;
    const Row = JSPlayer.HTMLItems.Row;
    const SortableRow = JSPlayer.HTMLItems.SortableRow;
    const ListEvents = JSPlayer.EventsManager.ListEvents;
    const DragitManager = JSPlayer.DragitManager;
    const TrackEditor = JSPlayer.Tracks.TrackEditor;
    const TrackSearch = JSPlayer.Tracks.TrackSearch;

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
        this.eventsList = new ListEvents();
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
    };

    const SearchableGrid = function(parentCnt) {
        BaseGrid.call(this, parentCnt);
    };
    SearchableGrid.prototype = {
        search(term, cb) {
            cb = cb || this._doSearch.bind(this);
            this.filteredRows = this.rows.filter((r) => cb(r, term));
            this.eventsList.trigger('onSearchResult');
            this.render();
        },
        clearSearch() {
            this.filteredRows = [];
            this.eventsList.trigger('onSearchResult');
            this.render();
        },
        onSearchResult(cb, subscriber) {
            this.eventsList.onEventRegister({cb, subscriber}, 'onSearchResult');
        },
        render() {
            clearElementInnerHTML(this.parentCnt);
            if (this.head)
                this.parentCnt.append(this.head.render());
            
            let rows = this.rows;
            
            if (this.filteredRows && this.filteredRows.length > 0)
                rows = this.filteredRows;

            rows.forEach(row => this.parentCnt.append(row.render()));
        },
        _doSearch(row, term) {
            term = term.toLowerCase();
            const cells = row.getSearchableCells();
            for (let i = 0; i < cells.length; ++i) {
                let cell = cells[i];
                if (cell.innerContent().toLowerCase().includes(term))
                    return true;
            }

            return false;
        }
    }

    const SortableGrid = function(parentCnt) {
        SearchableGrid.call(this, parentCnt);
        this.indexedColumns = {};
        this.onSearchResult(this._checkResult.bind(this), this);
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

            if (isSorted) {
                this._sortGrid(colIndex, reversed)
            } else {
                this.filteredRows = [];
            }
            this.eventsList.trigger('onSortedGrid', isSorted, reversed);
            this.render();
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
        _sortGrid(colIndex, reversed) {
            const type = this.head.getCellByIndex(colIndex).getType();
            this.filteredRows = [...this.rows].sort((row1, row2) => {
                if (row1.isHead())
                    return 0;
                const cnt1 = type && type == 'int' ? parseInt(row1.getCellByIndex(colIndex).innerContent()) : row1.getCellByIndex(colIndex).innerContent();
                const cnt2 = type && type == 'int' ? parseInt(row2.getCellByIndex(colIndex).innerContent()) : row2.getCellByIndex(colIndex).innerContent();

                if (cnt1 > cnt2) return reversed ? -1 : 1;
                if (cnt1 < cnt2) return reversed ? 1 : -1;
                return 0;
            });
        },
        _checkResult() {
            if (this.filteredRows.length == 0) {
                this.head.clearSortedCells();
            }
        }
    }

    Object.setPrototypeOf(IndexedColumn.prototype, BaseColumn.prototype);
    Object.setPrototypeOf(SearchableGrid.prototype, BaseGrid.prototype);
    Object.setPrototypeOf(SortableGrid.prototype, SearchableGrid.prototype);

    const GridMaker = function(parentCnt, sortable, searchable) {
        this.rows = [];
        this.sortable = sortable;
        this.searchable = searchable;
        if (sortable) {
            this.grid = new SortableGrid(parentCnt);
            this.grid.onSortedGrid(this._onSortedGrid.bind(this));
        } else {
            this.grid = new BaseGrid(parentCnt);
        }
        window.addEventListener('keydown', (evt) => {
            if(evt.key == ' ' && evt.target == parentCnt) {
                evt.preventDefault();
            }
        });
    };
    GridMaker.prototype = {
        setRows(rows) {
            for (let i = 0; i < rows.length; ++i) {
                this.makeRow(rows[i]);
            }
        },
        getGrid() {
            return this.grid;
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
                
                if (c.hasOwnProperty('onClick')) {
                    cell.onClick(c.onClick);
                }

                if (typeof c.data === 'object') {
                    let data = c.data;
                    Object.keys(c.data).forEach(k => cell.data(k, data[k]));
                }

                cell.innerContent(c.content);
                cell.setSearchable(c.searchable);

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

    const TracklistGrid = function(selector, audioPlayer) {
        selector = selector || '#table-content';
        this.gridMaker = new GridMaker(document.querySelector(selector), true);
        this.gridMaker.setDraggable(true, true);
        this.audioPlayer = audioPlayer;
        this.trackSearch = new TrackSearch(this.gridMaker.getGrid());
        this.trackSearch.init();
        this.overlayDiv = document.querySelector('.cnt-overlay');
        this.overlayDiv.addEventListener('click', (evt) => {
            if (evt.target != evt.currentTarget)
                return;
            this.overlayDiv.style.display = 'none';
        });
    };
    TracklistGrid.prototype = {
        setTracklist(tracklist) {
            this.tracklist = tracklist;
            TrackEditor.tracklist = tracklist;
        },
        addTrackToGrid({track, index}) {
            this.gridMaker.makeRowIdx([{
                content: parseInt(index) + 1,
                width: 8,
                unit: '%',
                type: 'int',
            },{
                content: track.getTitle(),
                editable: true,
                onEdit: TrackEditor.onclickCell.bind(TrackEditor),
                onValidate: TrackEditor.onValidate.bind(TrackEditor),
                width: 24,
                unit: '%',
                type: 'str',
                searchable: true,
                data: {
                    trackId: track.trackUUid,
                    fieldType: 'title',
                }
            },{
                content: track.getArtist(),
                editable: true,
                onEdit: TrackEditor.onclickCell.bind(TrackEditor),
                onValidate: TrackEditor.onValidate.bind(TrackEditor),
                width: 24,
                unit: '%',
                type: 'str',
                searchable: true,
                data: {
                    trackId: track.trackUUid,
                    fieldType: 'artist',
                }
            },{
                content: track.getAlbum(),
                editable: true,
                onEdit: TrackEditor.onclickCell.bind(TrackEditor),
                onValidate: TrackEditor.onValidate.bind(TrackEditor),
                width: 24,
                unit: '%',
                type: 'str',
                searchable: true,
                data: {
                    trackId: track.trackUUid,
                    fieldType: 'album',
                }
            }, {
                content: track.getTrackDuration(true),
                width: 8,
                unit: '%'
            }, {
                content: `<span data-track-id="${track.trackUUid}" class="track-actions"><li class="fa-solid fa-ellipsis"></li></span>`,
                width: 4,
                unit: '%'
            }, {
                content: '<div class="action-play"><li class="fa-solid fa-play"></li></div>',
                width: 4,
                unit: '%',
                onClick: this.playSongFromTracklist.bind(this, index),
                textAlign: 'center',
            }, {
                content: 'drag',
                draggable: true,
                onDragged: (evt) => {
                    evt.detail.HTMLItem.innerContent('Drop me!!');
                },
                onDropped: (evt) => {
                    evt.detail.HTMLItem.innerContent('drag');
                },
                width: 4,
                unit: '%'
            }], true, false, parseInt(index) + 1);
        },
        buildGrid() {
            this._buildHeaders();
            this._buildBody();
        },
        render() {
            this.gridMaker.render();
        },
        playSongFromTracklist(trackIndex) {
            this.tracklist.getCurrentTrack().onTagChangeUnsub(this.audioPlayer);
            this.tracklist.setTrackIndex(trackIndex, true);
        },
        _buildHeaders() {
            this.gridMaker.makeRowIdx([{
                content: 'N°',
                sorterCell: true,
                width: 8,
                unit: '%',
                type: 'int',
                textAlign: 'center',
            },{
                content: 'Title',
                sorterCell: true,
                width: 24,
                unit: '%',
                type: 'str',
                textAlign: 'center',
            },{
                content: 'Artist',
                sorterCell: true,
                width: 24,
                unit: '%',
                type: 'str',
                textAlign: 'center',
            },{
                content: 'Album',
                sorterCell: true,
                width: 24,
                unit: '%',
                type: 'str',
                textAlign: 'center',
            }, {
                content: 'duration',
                sorterCell: true,
                width: 8,
                unit: '%',
                type: 'str',
                textAlign: 'center',
            }, {
                content: '&nbsp;',
                width: 4,
                unit: '%'
            }, {
                content: '&nbsp;',
                width: 4,
                unit: '%'
            }, {
                content: '&nbsp;',
                width: 4,
                unit: '%'
            }], true, true, 0); 
        },
        _buildBody() {
            for (let trackIdx of this.tracklist.iterOverTrack()) {
                this.addTrackToGrid(trackIdx);
            }
        },
    }
    
   JSPlayer.Grids = {TracklistGrid};

})(this, document, this.JSPlayer);