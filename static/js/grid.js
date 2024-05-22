(function(window, document, JSPlayer, undefined) {

    const {clearElementInnerHTML} = JSPlayer.Utils;
    const {Cell, SortableCell, Row, SortableRow, HTMLItems} = JSPlayer.HTMLItems;
    const ListEvents = JSPlayer.EventsManager.ListEvents;
    const DragitManager = JSPlayer.DragitManager;
    const TrackEditor = JSPlayer.Tracks.TrackEditor;
    const TrackSearch = JSPlayer.Tracks.TrackSearch;
    const TrackListBrowser = JSPlayer.Components.TrackListBrowser;
    const {TrackListManager} = JSPlayer.TrackListV2;

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
        getRowByIndex(index) {
            return this.rows[index];
        },
        setHead(row) {
            this.head = row;
        },
        addRow(row) {
            this.rows.push(row);
        },
        length() {
            return this.rows.length;
        },
        getParentCnt() {
            return this.parentCnt;
        },
        clear() {
            this.rows = [];
        },
        removeRow(index) {
            const row = this.rows.splice(index, 1)[0];
            row.remove(); 
            console.trace();
        },
        open() {
            this.parentCnt.style.display = 'block';
        },
        close() {
            this.parentCnt.style.display = 'none';
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
            return this;
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
            this.eventsList.trigger('onSortedGrid', indexedColumn.isSorted(), indexedColumn.isRever<sed());
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
                this.makeRowIdx(rows[i], true, false, i);
            }
        },
        addRow(row) {
            this.rows.push(this.buildRow(row));
        },
        clearRows() {
            this.grid.clear();
        },
        resetDragDrop() {
            this._unsetDraggableGrid();
            this._setDraggableGrid();
        },
        getRowByIndex(index) {
            return this.grid.getRowByIndex(index);
        },
        removeRowFromGrid(index) {
            this.grid.removeRow(index);
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
            let row = this.buildRow(cells, autoWidth, head);

            if (!this.byCell && !row.isHead())
                row.setDraggable(this.draggable);

            if (this.sortable)
                row.setIndex(idx);

            if (row.isHead())
                this.grid.setHead(row);
            else
                this.grid.addRow(row);
            return row;
        },
        buildRow(cells, autoWidth, head) {
            let row;
            if (this.sortable) {
                row = new SortableRow(head);
            } else
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

            return row;
        },
        render() {
            this.grid.render();
            if (this.isDraggable())
                this._setDraggableGrid();
        },
        reload() {
            if (this.isDraggable()) {
                this._unsetDraggableGrid();
            }
            this.render();
        },
        open() {
            this.grid.open();
        },
        close() {
            this.grid.close();
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
            this.dragitManager = null;
        }
    }

    const TracklistGrid = function(selector, audioPlayer) {
        selector = selector || '#table-content';
        this.gridMaker = new GridMaker(document.querySelector(selector), true);
        this.gridMaker.setDraggable(true, true);
        this.audioPlayer = audioPlayer;
        this.trackSearch = new TrackSearch(this.getGrid());
        this.trackSearch.onSearchVisibilityChange(this._restoreGrid.bind(this), this);
        this.trackSearch.init();
        
        this._trackListBrowser = new TrackListBrowser(this.audioPlayer, this);
        TrackListManager.onRemoveTrackFromTrackList(this.removeTrackFromGrid.bind(this))
    };
    TracklistGrid.prototype = {
        setUp() {
            this.queuelistGrid = new QueuelistGrid(this._trackListBrowser, this);
            TrackListManager.onShuffleTracklist((track, index) => {
                this.gridMaker.resetDragDrop();
                this.gridMaker.clearRows();
                this.buildGrid(true);
                this._trackListBrowser.setCurrentlyPlayingTrack(track, index);
                this.queuelistGrid.render(); 
            }, this);
        },
        appendTrackToGrid({track}) {
            const index = this.getGrid().length();
            track.setIndex(index);
            this.addTrackToGrid({track, index});
            this.reload();
            this.queuelistGrid.render();
        },
        addTrackToGrid({track, index}) {
            const rowConfig = this._getRowConfigFromTrack(track, index);
            this.gridMaker.makeRowIdx(rowConfig, false, false, parseInt(index) + 1);
        },
        removeTrackFromGrid({index}) {
            this.removeFromGrid(index);
            this.reload();
            this.queuelistGrid.render();
        },
        removeFromGrid(rowIdx) {
            this.gridMaker.removeRowFromGrid(rowIdx);
        },
        buildGrid(doRender) {
            this._buildHeaders();
            this._buildBody();

            if (doRender) {
                this.render();
            }
        },
        getGrid() {
            return this.gridMaker.getGrid();
        },
        getParentCnt() {
            return this.getGrid().getParentCnt();
        },
        render() {
            this.gridMaker.render();
            this._displayTracklistInfo();
        },
        reload() {
            this.gridMaker.reload();
            this._displayTracklistInfo();
            const {track, index} = TrackListManager.getCurrentTrack();
            this._trackListBrowser.setCurrentlyPlayingTrack(track, index);
        },
        open() {
            this._trackListBrowser.show();
            this.gridMaker.open();
        },
        close() {
            this._trackListBrowser.hide();
            this.gridMaker.close();
        },
        getRowByIndex(index) {
            return this.gridMaker.getRowByIndex(index);
        },
        _restoreGrid(isVisible) {
            if (!isVisible) {
                this.reload();
                this.queuelistGrid.render();
            }
        },
        _buildHeaders() {
            console.log('_buildHeaders');
            const head = [{
                content: 'N°',
                sorterCell: true,
                width: 5,
                unit: '%',
                type: 'int',
                textAlign: 'center',
            },{
                content: 'Title',
                sorterCell: true,
                width: 25,
                unit: '%',
                type: 'str',
                textAlign: 'center',
            },{
                content: 'Artist',
                sorterCell: true,
                width: 25,
                unit: '%',
                type: 'str',
                textAlign: 'center',
            },{
                content: 'Album',
                sorterCell: true,
                width: 25,
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
            }];

            this.gridMaker.makeRowIdx(head, false, true, 0);
        },
        _getRowConfigFromTrack(track, index) {
            return [{
                content: parseInt(index) + 1,
                width: 5,
                unit: '%',
                type: 'int',
            },{
                content: track.getTitle(),
                editable: true,
                onEdit: TrackEditor.onclickCell.bind(TrackEditor),
                onValidate: TrackEditor.onValidate.bind(TrackEditor),
                width: 25,
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
                width: 25,
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
                width: 25,
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
                unit: '%',
                onClick: this._trackListBrowser.showActionMenu.bind(this._trackListBrowser),
                data: {
                    trackId: track.trackUUid
                }
            }, {
                content: '<div class="action-play"><li class="fa-solid fa-play"></li></div>',
                width: 4,
                unit: '%',
                onClick: this._trackListBrowser.playSongFromTracklist.bind(this._trackListBrowser),
                textAlign: 'center',
            }, {
                content: 'drag',
                draggable: true,
                onDragged: (evt) => {
                    this.draggedStartIndx = evt.detail.HTMLItem.getParentItem().getIndex();
                    evt.detail.HTMLItem.innerContent('Drop!!');
                },
                onDropped: (evt) => {
                    evt.stopImmediatePropagation();
                    const htmlItem = evt.detail.HTMLItem;
                    this.draggedEndIndx = htmlItem.getParentItem().getIndex();
                    TrackListManager.switchTrackIndex(this.draggedStartIndx - 1, this.draggedEndIndx - 1);
                    this.queuelistGrid.render();
                    htmlItem.innerContent('drag');
                },
                width: 4,
                unit: '%'
            }];
        },
        _buildBody() {
            for (let {index, track} of TrackListManager.iterOverTrack()) {
                this.addTrackToGrid({index, track});
            }
        },
        _displayTracklistInfo() {
            const nbTracksElem = document.querySelector('.tracklist-info-cnt .tracklist-info-nb .nb-tracks');
            const totalDurationElem = document.querySelector('.tracklist-info-cnt .tracklist-info-duration .duration-tracks');
            nbTracksElem.innerText = TrackListManager.getTracksNumber();
            totalDurationElem.innerText = TrackListManager.getTrackListTotalDuration(true);
        },
    }
    
    const QueuelistGrid = function(trackListBrowser, parentGrid) {
        this.trackListBrowser = trackListBrowser;
        this.setUpHTMLItem();
        this.parentGrid = parentGrid;
        this.gridMaker = new GridMaker(this.itemHtml.render(), false);
        TrackListManager.onAddedToQueue(this.updateQueue.bind(this), this);
        TrackListManager.onDepletingQueue(this.nextTrackInQueue.bind(this), this);
    };
    QueuelistGrid.prototype = {
        setUpHTMLItem() {
            this.itemHtml = new HTMLItems('div');
            this.itemHtml.setClassName('queue-list');
        },
        buildGrid(doRender) {
            this._buildBody();
            if (doRender) {
                this.render();
            }
        },
        setSiblingRow(row) {
            if (!this.siblingRow || this.siblingRow != row)
                this.siblingRow = row;
        },
        getGrid() {
            return this.gridMaker.getGrid();
        },
        getParentCnt(getMine) {
            if (getMine)
                return this.getGrid().getParentCnt();
            return this.parentGrid.getParentCnt();
        },
        getRowByIndex(index) {
            return this.gridMaker.getRowByIndex(index);
        },
        updateQueue({track}, queueLength) {
            if (!this.hasQueue && queueLength > 0) {
                this.hasQueue = true;
            }

            this.gridMaker.clearRows();
            if (this.isQueuePlaying) {
                const {track} = TrackListManager.getCurrentTrack();
                this._buildBody(track, 0);
                const row = this.getGrid().getRowByIndex(0);
                row.classAdd('currently-playing');
                return this.render();
            }

            this.buildGrid(true);
        },
        nextTrackInQueue({track}, queueLength) {
            if (queueLength >= 0) {
                this.isQueuePlaying = true;
                this.trackListBrowser.setGrid(this);
                this.gridMaker.clearRows();
                this._buildBody(track, 0);
                const row = this.getGrid().getRowByIndex(0);
                row.classAdd('currently-playing');
                return this.render();
            }
            this.hasQueue = false;
            this.isQueuePlaying = false;
            this.trackListBrowser.setGrid(this.parentGrid);
            this.itemHtml.remove();
            this.siblingRow = undefined;
        },
        render() {
            if (!this.hasQueue) {
                this.itemHtml.remove();
                return;
            }

            const row = this._setSiblingRow();
            if (!row) {
                this.itemHtml.remove();
                console.error('NO ROW FOUND! REMOVING QUEUE GRID');
                return;
            }

            this.itemHtml.show();
            row.render().insertAdjacentElement('afterend', this.itemHtml.render());
            this.gridMaker.render();
        },
        _setSiblingRow() {
            if (this.siblingRow)
                return this.siblingRow;

            const currIdx = TrackListManager.getCurrentTrackIndex(!this.isQueuePlaying);
            if (currIdx < 0) {
                currIdx = 0;
            }

            this.setSiblingRow(this.parentGrid.getRowByIndex(currIdx));
            return this.siblingRow;
        },
        addTrackToGrid({track, index}) {
            const row = this._getCellsFromTrack(track, index);
            this.gridMaker.makeRowIdx(row, false, false, parseInt(index) + 1);
        },
        removeRowFromGrid(rowIdx) {
            this.gridMaker.removeRowFromGrid(rowIdx);
        },
        _getCellsFromTrack(track, index) {
            return [{
                content: `Q${parseInt(index) + 1}`,
                width: 5,
                unit: '%',
                type: 'int',
            },{
                content: track.getTitle(),
                editable: true,
                onEdit: TrackEditor.onclickCell.bind(TrackEditor),
                onValidate: TrackEditor.onValidate.bind(TrackEditor),
                width: 25,
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
                width: 25,
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
                width: 25,
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
                unit: '%',
                //onClick: this._trackListBrowser.showActionMenu.bind(this._trackListBrowser),
                data: {
                    trackId: track.trackUUid
                }
            }, {
                content: '<div class="action-play"><li class="fa-solid fa-play"></li></div>',
                width: 4,
                unit: '%',
                // onClick: this._trackListBrowser.playSongFromTracklist.bind(this._trackListBrowser),
                textAlign: 'center',
            }, {
                content: 'remove',
                width: 4,
                unit: '%'
            }];
        },
        _buildBody(curTrack, curIndex) {
            let addIdx = 0;
            if (typeof curTrack === 'object' && typeof curIndex === 'number') {
                this.addTrackToGrid({index: curIndex, track: curTrack});
                addIdx = 1;
            }
            for (let {index, track} of TrackListManager.iterOverQueue()) {
                index += addIdx;
                this.addTrackToGrid({index, track});
            }
        },
    }

   JSPlayer.Grids = {TracklistGrid};

})(this, document, this.JSPlayer);