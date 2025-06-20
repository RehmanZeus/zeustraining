var MAX_GRID_ROWS = 100000;
var MAX_GRID_COLS = 500 + 1;
var MIN_GRIDCELL_WIDTH = 60;
var MIN_GRIDCELL_HEIGHT = 20;
var DPR = window.devicePixelRatio || 1;
var SetupExcelSheet = /** @class */ (function () {
    function SetupExcelSheet(gridWidth, gridHeight, nrows, ncols) {
        /**@type {number} Stores the width of the canvas*/
        this.canvasWidth = window.innerWidth;
        /**@type {number} Stores the height of the canvas*/
        this.canvasHeight = window.innerHeight;
        this.canvasWidth = ncols * gridWidth;
        this.canvasHeight = nrows * gridHeight;
    }
    SetupExcelSheet.prototype.init = function () {
        this.canvas = document.getElementById("canvas");
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        this.ctx = this.canvas.getContext("2d");
        this.ctx.scale(DPR, DPR);
        return this.canvas;
    };
    SetupExcelSheet.prototype.getContext = function () {
        return this.ctx;
    };
    return SetupExcelSheet;
}());
var GridResizer = /** @class */ (function () {
    function GridResizer(canvas, ctx, gridMatrix) {
        this.isResizingCol = false;
        this.isResizingRow = false;
        this.resizingColIndex = -1;
        this.resizingRowIndex = -1;
        this.startX = 0;
        this.startY = 0;
        this.resizeThreshold = 5;
        this.canvas = canvas;
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;
        this.attachEvents();
    }
    GridResizer.prototype.attachEvents = function () {
        this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
        this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
        this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
        this.canvas.addEventListener("mousemove", this.handleResize.bind(this));
    };
    GridResizer.prototype.handleMouseMove = function (e) {
        var _a = this.getMousePosition(e), x = _a.x, y = _a.y;
        var colIndex = Math.floor(x / MIN_GRIDCELL_WIDTH);
        var rowIndex = Math.floor(y / MIN_GRIDCELL_HEIGHT);
        var colEdge = (colIndex + 1) * MIN_GRIDCELL_WIDTH;
        var rowEdge = (rowIndex + 1) * MIN_GRIDCELL_HEIGHT;
        if (Math.abs(x - colEdge) < this.resizeThreshold) {
            this.canvas.style.cursor = "col-resize";
        }
        else if (Math.abs(y - rowEdge) < this.resizeThreshold) {
            this.canvas.style.cursor = "row-resize";
        }
        else {
            this.canvas.style.cursor = "default";
        }
    };
    GridResizer.prototype.handleMouseDown = function (e) {
        var _a = this.getMousePosition(e), x = _a.x, y = _a.y;
        var colIndex = Math.floor(x / MIN_GRIDCELL_WIDTH);
        var rowIndex = Math.floor(y / MIN_GRIDCELL_HEIGHT);
        var colEdge = (colIndex + 1) * MIN_GRIDCELL_WIDTH;
        var rowEdge = (rowIndex + 1) * MIN_GRIDCELL_HEIGHT;
        if (Math.abs(x - colEdge) < this.resizeThreshold) {
            this.isResizingCol = true;
            this.resizingColIndex = colIndex;
            this.startX = x;
        }
        else if (Math.abs(y - rowEdge) < this.resizeThreshold) {
            this.isResizingRow = true;
            this.resizingRowIndex = rowIndex;
            this.startY = y;
        }
    };
    GridResizer.prototype.handleMouseUp = function () {
        this.isResizingCol = false;
        this.isResizingRow = false;
        this.resizingColIndex = -1;
        this.resizingRowIndex = -1;
    };
    GridResizer.prototype.recalculateCellPositions = function () {
        for (var rowIndex = 0; rowIndex < this.gridMatrix.grid.length; rowIndex++) {
            var x = 0;
            for (var colIndex = 0; colIndex < this.gridMatrix.grid[rowIndex].length; colIndex++) {
                var cell = this.gridMatrix.grid[rowIndex][colIndex];
                cell.x = x;
                x += cell.width;
            }
        }
        for (var colIndex = 0; colIndex < this.gridMatrix.grid[0].length; colIndex++) {
            var y = 0;
            for (var rowIndex = 0; rowIndex < this.gridMatrix.grid.length; rowIndex++) {
                var cell = this.gridMatrix.grid[rowIndex][colIndex];
                cell.y = y;
                y += cell.height;
            }
        }
    };
    GridResizer.prototype.handleResize = function (e) {
        if (!this.isResizingCol && !this.isResizingRow)
            return;
        var _a = this.getMousePosition(e), x = _a.x, y = _a.y;
        if (this.isResizingCol && this.resizingColIndex >= 0) {
            var delta = x - this.startX;
            if (this.gridMatrix.columnWidths[this.resizingColIndex] + delta >= MIN_GRIDCELL_WIDTH) {
                this.gridMatrix.columnWidths[this.resizingColIndex] += delta;
            }
            this.startX = x;
        }
        if (this.isResizingRow && this.resizingRowIndex >= 0) {
            var delta = y - this.startY;
            if (this.gridMatrix.rowHeights[this.resizingRowIndex] + delta >= MIN_GRIDCELL_HEIGHT) {
                this.gridMatrix.rowHeights[this.resizingRowIndex] += delta;
            }
            this.startY = y;
        }
        this.gridMatrix.grid = [];
        this.gridMatrix.initializeGrid();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.gridMatrix.drawGrid(this.ctx);
    };
    GridResizer.prototype.getMousePosition = function (e) {
        var rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };
    return GridResizer;
}());
var GridCell = /** @class */ (function () {
    function GridCell(id, x, y, c, width, height, data) {
        this.height = MIN_GRIDCELL_HEIGHT;
        this.width = MIN_GRIDCELL_WIDTH;
        this.x = 0;
        this.y = 0;
        this.id = id;
        this.x = x;
        this.y = y;
        this.c = c;
        this.width = width ? width : this.width;
        this.height = height ? height : this.width;
        this.data = data;
    }
    GridCell.generateHeader = function (index) {
        var header = "";
        while (index >= 0) {
            header = String.fromCharCode((index % 26) + 65) + header;
            index = Math.floor(index / 26) - 1;
        }
        return header;
    };
    return GridCell;
}());
var GridMatrix = /** @class */ (function () {
    function GridMatrix(c, rows, cols) {
        this.noOfRows = MAX_GRID_ROWS;
        this.noOfCols = MAX_GRID_COLS;
        this.grid = [];
        this.columnWidths = [];
        this.rowHeights = [];
        this.noOfRows = rows !== null && rows !== void 0 ? rows : this.noOfRows;
        this.noOfCols = cols !== null && cols !== void 0 ? cols : this.noOfCols;
        this.c = c;
        this.columnWidths = Array(this.noOfCols).fill(MIN_GRIDCELL_WIDTH);
        this.rowHeights = Array(this.noOfRows).fill(MIN_GRIDCELL_HEIGHT);
        this.initializeGrid();
    }
    GridMatrix.prototype.initializeGrid = function () {
        for (var row = 0; row < this.noOfRows; row++) {
            var rowCells = [];
            for (var col = 0; col < this.noOfCols; col++) {
                var id = "cell-".concat(row, "-").concat(col);
                var x = col * MIN_GRIDCELL_WIDTH;
                var y = row * MIN_GRIDCELL_HEIGHT;
                var cell = void 0;
                if (row === 0 && col === 0) {
                    cell = new GridCell(id, x, y, this.c, MIN_GRIDCELL_WIDTH, MIN_GRIDCELL_HEIGHT, "");
                }
                else if (row === 0) {
                    var header = GridCell.generateHeader(col - 1);
                    cell = new GridCell(id, x, y, this.c, MIN_GRIDCELL_WIDTH, MIN_GRIDCELL_HEIGHT, header);
                }
                else if (col === 0) {
                    cell = new GridCell(id, x, y, this.c, MIN_GRIDCELL_WIDTH, MIN_GRIDCELL_HEIGHT, "".concat(row));
                }
                else {
                    cell = new GridCell(id, x, y, this.c, MIN_GRIDCELL_WIDTH, MIN_GRIDCELL_HEIGHT);
                }
                rowCells.push(cell);
            }
            this.grid.push(rowCells);
        }
    };
    GridMatrix.prototype.drawGrid = function (ctx) {
        ctx.strokeStyle = "#ccc";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (var _i = 0, _a = this.grid; _i < _a.length; _i++) {
            var row = _a[_i];
            for (var _b = 0, row_1 = row; _b < row_1.length; _b++) {
                var cell = row_1[_b];
                ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
                if (cell.data) {
                    ctx.fillText(cell.data, cell.x + cell.width / 2, cell.y + cell.height / 2);
                }
            }
        }
    };
    return GridMatrix;
}());
var handleGridCell = function () { };
window.onload = function () {
    var setup = new SetupExcelSheet(MIN_GRIDCELL_WIDTH, MIN_GRIDCELL_HEIGHT, 500, 100);
    var canvas = setup.init();
    var ctx = setup.getContext();
    var gridMatrix = new GridMatrix(ctx, 500, 100);
    gridMatrix.drawGrid(ctx);
    new GridResizer(canvas, ctx, gridMatrix);
};
