const MAX_GRID_ROWS = 100000;
const MAX_GRID_COLS = 500 + 1;
const MIN_GRIDCELL_WIDTH = 60;
const MIN_GRIDCELL_HEIGHT = 20;
const DPR = window.devicePixelRatio || 1;

class SetupExcelSheet {

    /**@type {number} Stores the width of the canvas*/
    canvasWidth: number = window.innerWidth;

    /**@type {number} Stores the height of the canvas*/
    canvasHeight: number = window.innerHeight;

    /**@type {HTMLCanvasElement} stores the global canvas for the sheet*/
    canvas!: HTMLCanvasElement;

    /**@type {CanvasRenderingContext2D} stores the 2d context for the canvas sheet in use*/
    ctx!: CanvasRenderingContext2D;


    constructor(gridWidth: number, gridHeight: number, nrows: number, ncols: number) {
        this.canvasWidth = ncols * gridWidth;
        this.canvasHeight = nrows * gridHeight;
    }

    init() {
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        this.ctx = this.canvas.getContext("2d")!;
        this.ctx.scale(DPR, DPR);
        return this.canvas;
    }

    getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }
}


class GridResizer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    gridMatrix: GridMatrix;

    isResizingCol = false;
    isResizingRow = false;
    resizingColIndex = -1;
    resizingRowIndex = -1;
    startX = 0;
    startY = 0;
    resizeThreshold = 5;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;

        this.attachEvents();
    }

    attachEvents() {
        this.canvas.addEventListener("pointermove", this.handleMouseMove.bind(this));
        this.canvas.addEventListener("pointerdown", this.handleMouseDown.bind(this));
        this.canvas.addEventListener("pointerup", this.handleMouseUp.bind(this));
        this.canvas.addEventListener("pointermove", this.handleResize.bind(this));
    }

    handleMouseMove(e: MouseEvent) {
        const { x, y } = this.getMousePosition(e);
        const colIndex = this.getColumnIndex(x);
        const rowIndex = this.getRowIndex(y);


        const colEdge = this.gridMatrix.columnWidths.slice(0, colIndex + 1).reduce((a, b) => a + b, 0);
        const rowEdge = this.gridMatrix.rowHeights.slice(0, rowIndex + 1).reduce((a, b) => a + b, 0);

        if (Math.abs(x - colEdge) < this.resizeThreshold) {
            this.canvas.style.cursor = "col-resize";
        } else if (Math.abs(y - rowEdge) < this.resizeThreshold) {
            this.canvas.style.cursor = "row-resize";
        } else {
            this.canvas.style.cursor = "default";
        }
    }

    handleMouseDown(e: MouseEvent) {
        const { x, y } = this.getMousePosition(e);
        const colIndex = this.getColumnIndex(x);
        const rowIndex = this.getRowIndex(y);

        const colEdge = this.gridMatrix.columnWidths.slice(0, colIndex + 1).reduce((a, b) => a + b, 0);
        const rowEdge = this.gridMatrix.rowHeights.slice(0, rowIndex + 1).reduce((a, b) => a + b, 0);

        if (Math.abs(x - colEdge) < this.resizeThreshold) {
            this.isResizingCol = true;
            this.resizingColIndex = colIndex;
            this.startX = x;
        } else if (Math.abs(y - rowEdge) < this.resizeThreshold) {
            this.isResizingRow = true;
            this.resizingRowIndex = rowIndex;
            this.startY = y;
        }
    }


    handleMouseUp() {
        this.isResizingCol = false;
        this.isResizingRow = false;
        this.resizingColIndex = -1;
        this.resizingRowIndex = -1;
    }

    recalculateCellPositions() {
        for (let rowIndex = 0; rowIndex < this.gridMatrix.grid.length; rowIndex++) {
            let x = 0;
            for (let colIndex = 0; colIndex < this.gridMatrix.grid[rowIndex].length; colIndex++) {
                const cell = this.gridMatrix.grid[rowIndex][colIndex];
                cell.x = x;
                x += cell.width;
            }
        }

        for (let colIndex = 0; colIndex < this.gridMatrix.grid[0].length; colIndex++) {
            let y = 0;
            for (let rowIndex = 0; rowIndex < this.gridMatrix.grid.length; rowIndex++) {
                const cell = this.gridMatrix.grid[rowIndex][colIndex];
                cell.y = y;
                y += cell.height;
            }
        }
    }

    getColumnIndex(x: number): number {
        let total = 0;
        for (let i = 0; i < this.gridMatrix.columnWidths.length; i++) {
            total += this.gridMatrix.columnWidths[i];
            if (x < total) return i;
        }
        return -1;
    }

    getRowIndex(y: number): number {
        let total = 0;
        for (let i = 0; i < this.gridMatrix.rowHeights.length; i++) {
            total += this.gridMatrix.rowHeights[i];
            if (y < total) return i;
        }
        return -1;
    }

    handleResize(e: MouseEvent) {
        if (!this.isResizingCol && !this.isResizingRow) return;

        const { x, y } = this.getMousePosition(e);

        if (this.isResizingCol && this.resizingColIndex > 0) {
            const delta = x - this.startX;
            const newWidth = this.gridMatrix.columnWidths[this.resizingColIndex] + delta;

            if (newWidth >= MIN_GRIDCELL_WIDTH) {
                this.gridMatrix.columnWidths[this.resizingColIndex] = newWidth;
                this.startX = x;
            }
        }

        if (this.isResizingRow && this.resizingRowIndex > 0) {
            const delta = y - this.startY;
            const newHeight = this.gridMatrix.rowHeights[this.resizingRowIndex] + delta;

            if (newHeight >= MIN_GRIDCELL_HEIGHT) {
                this.gridMatrix.rowHeights[this.resizingRowIndex] = newHeight;
                this.startY = y;
            }
        }

        for (let row = 0; row < this.gridMatrix.noOfRows; row++) {
            let y = 0;
            for (let r = 0; r < row; r++) {
                y += this.gridMatrix.rowHeights[r];
            }

            let x = 0;
            const rowCells = this.gridMatrix.grid[row];
            for (let col = 0; col < this.gridMatrix.noOfCols; col++) {
                const cell = rowCells[col];

                x = 0;
                for (let c = 0; c < col; c++) {
                    x += this.gridMatrix.columnWidths[c];
                }

                cell.x = x;
                cell.y = y;
                cell.width = this.gridMatrix.columnWidths[col];
                cell.height = this.gridMatrix.rowHeights[row];
            }
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.gridMatrix.drawGrid(this.ctx);
    }





    getMousePosition(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
}

class GridCell {

    id: string;
    height: number = MIN_GRIDCELL_HEIGHT;
    width: number = MIN_GRIDCELL_WIDTH;
    x: number = 0;
    y: number = 0;
    data: string | undefined;
    c: CanvasRenderingContext2D;

    constructor(id: string, x: number, y: number, c: CanvasRenderingContext2D, width?: number, height?: number, data?: string) {

        this.id = id;
        this.x = x;
        this.y = y;
        this.c = c;
        this.width = width ? width : this.width;
        this.height = height ? height : this.width;
        this.data = data;

    }

    static generateHeader(index: number): string {
        let header = "";
        while (index >= 0) {
            header = String.fromCharCode((index % 26) + 65) + header;
            index = Math.floor(index / 26) - 1;
        }
        return header;
    }

}

class GridMatrix {
    noOfRows: number = MAX_GRID_ROWS;
    noOfCols: number = MAX_GRID_COLS;
    grid: GridCell[][] = [];
    c: CanvasRenderingContext2D;
    columnWidths: number[] = [];
    rowHeights: number[] = [];

    constructor(c: CanvasRenderingContext2D, rows?: number, cols?: number) {
        this.noOfRows = rows ?? this.noOfRows;
        this.noOfCols = cols ?? this.noOfCols;
        this.c = c;

        this.columnWidths = Array(this.noOfCols).fill(MIN_GRIDCELL_WIDTH);
        this.rowHeights = Array(this.noOfRows).fill(MIN_GRIDCELL_HEIGHT);

        this.initializeGrid();
    }


    initializeGrid() {
        this.grid = [];

        for (let row = 0; row < this.noOfRows; row++) {
            const rowCells: GridCell[] = [];
            let y = this.rowHeights.slice(0, row).reduce((a, b) => a + b, 0);

            for (let col = 0; col < this.noOfCols; col++) {
                const header = GridCell.generateHeader(col - 1)
                const id = `${row}${header}`;
                let x = this.columnWidths.slice(0, col).reduce((a, b) => a + b, 0);
                let width = this.columnWidths[col];
                let height = this.rowHeights[row];

                let data: string | undefined;
                if (row === 0 && col === 0) data = "";
                else if (row === 0) data = header;
                else if (col === 0) data = `${row}`;
                const cell = new GridCell(id, x, y, this.c, width, height, data);
                rowCells.push(cell);


            }

            this.grid.push(rowCells);
        }
    }


    drawGrid(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = "#ccc";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let row of this.grid) {
            for (let cell of row) {
                ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
                if (cell.data) {
                    ctx.fillText(cell.data, cell.x + cell.width / 2, cell.y + cell.height / 2);
                }
            }
        }
    }
}



const handleGridCell = () => { }

window.onload = () => {
    const setup = new SetupExcelSheet(MIN_GRIDCELL_WIDTH, MIN_GRIDCELL_HEIGHT, 500, 100);
    const canvas = setup.init();
    const ctx = setup.getContext();

    const gridMatrix = new GridMatrix(ctx, 500, 100);
    gridMatrix.drawGrid(ctx);

    new GridResizer(canvas, ctx, gridMatrix);
};
