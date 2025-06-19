var MAX_GRID_ROWS = 100000;
var MAX_GRID_COLS = 500;
var MIN_GRIDCELL_WIDTH = 60;
var MIN_GRIDCELL_HEIGHT = 20;
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
                var cell = new GridCell(id, x, y, this.c);
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
window.onload = function () {
    var setup = new SetupExcelSheet();
    setup.init();
    var gridMatrix = new GridMatrix(setup.getContext(), 500, 100);
    gridMatrix.drawGrid(setup.getContext());
};
