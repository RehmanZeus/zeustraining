var MAX_GRID_ROWS = 100000;
var MAX_GRID_COLS = 500 + 1;
var MIN_GRIDCELL_WIDTH = 60;
var MIN_GRIDCELL_HEIGHT = 20;
var DPR = window.devicePixelRatio || 1;
var SetupExcelSheet = /** @class */ (function () {
    function SetupExcelSheet() {
        this.canvasWidth = window.innerWidth;
        this.canvasHeight = window.innerHeight;
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
        this.noOfRows = rows !== null && rows !== void 0 ? rows : this.noOfRows;
        this.noOfCols = cols !== null && cols !== void 0 ? cols : this.noOfCols;
        this.initializeGrid();
        this.c = c;
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
    var setup = new SetupExcelSheet();
    var canvas = setup.init();
    var ctx = setup.getContext();
    var gridMatrix = new GridMatrix(ctx, 500, 100);
    gridMatrix.drawGrid(ctx);
    canvas.addEventListener("click", handleGridCell);
};
