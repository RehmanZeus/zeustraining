const MAX_GRID_ROWS = 100000;
const MAX_GRID_COLS = 500 + 1;
const MIN_GRIDCELL_WIDTH = 60;
const MIN_GRIDCELL_HEIGHT = 20;
const DPR = window.devicePixelRatio || 1;

class SetupExcelSheet {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas!: HTMLCanvasElement;
    ctx!: CanvasRenderingContext2D;

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
    constructor(c: CanvasRenderingContext2D, rows?: number, cols?: number) {
        this.noOfRows = rows ?? this.noOfRows;
        this.noOfCols = cols ?? this.noOfCols;
        this.initializeGrid();
        this.c = c;
    }

    private initializeGrid() {
        for (let row = 0; row < this.noOfRows; row++) {
            const rowCells: GridCell[] = [];
            for (let col = 0; col < this.noOfCols; col++) {
                const id = `cell-${row}-${col}`;
                const x = col * MIN_GRIDCELL_WIDTH;
                const y = row * MIN_GRIDCELL_HEIGHT;
                let cell: GridCell;

                if (row === 0 && col === 0) {
                    cell = new GridCell(id, x, y, this.c, MIN_GRIDCELL_WIDTH, MIN_GRIDCELL_HEIGHT, "");
                } else if (row === 0) {
                    const header = GridCell.generateHeader(col - 1);
                    cell = new GridCell(id, x, y, this.c, MIN_GRIDCELL_WIDTH, MIN_GRIDCELL_HEIGHT, header);
                } else if (col === 0) {
                    cell = new GridCell(id, x, y, this.c, MIN_GRIDCELL_WIDTH, MIN_GRIDCELL_HEIGHT, `${row}`);
                } else {
                    cell = new GridCell(id, x, y, this.c, MIN_GRIDCELL_WIDTH, MIN_GRIDCELL_HEIGHT);
                }

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
    const setup = new SetupExcelSheet();
    const canvas = setup.init();
    const ctx = setup.getContext();

    const gridMatrix = new GridMatrix(ctx, 500, 100);

    gridMatrix.drawGrid(ctx);

    canvas.addEventListener("click", handleGridCell);

};
