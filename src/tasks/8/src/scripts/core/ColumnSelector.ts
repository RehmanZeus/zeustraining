import { GridMatrix } from "./GridMatrix";

export class ColumnSelector {
    ctx: CanvasRenderingContext2D;
    gridMatrix: GridMatrix;
    selectedCol = -1;

    selectionColor = "#0f9d58";
    selectionBorderColor = "#0f9d58";

    constructor(ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix) {
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;
    }

    /** Select a column by index and redraw */
    selectCol(col: number) {
        if (col < 1 || col >= this.gridMatrix.noOfCols) return; // skip header col
        this.selectedCol = col;
        this.redrawGrid();
    }

    /** Deselect any column */
    clearSelection() {
        this.selectedCol = -1;
        this.redrawGrid();
    }

    /** Get the data array for the selected column (excluding header row) */
    /** Get the data array for the selected column (excluding header row) */
    getSelectedColData(): string[] | undefined {
        if (this.selectedCol < 1) return undefined;
        const col = this.selectedCol;
        const data: string[] = [];
        // Start from row 1 to skip the row 0 header
        for (let row = 1; row < this.gridMatrix.noOfRows; row++) {
            const rowMap = this.gridMatrix.grid.get(row);
            if (rowMap) {
                const cell = rowMap.get(col);
                data.push(cell?.data || "");
            } else {
                data.push("");
            }
        }
        return data;
    }

    /** Set the data for the selected column (excluding header row) */
    setSelectedColData(data: string[]) {
        if (this.selectedCol < 1) return;
        for (let row = 1; row < this.gridMatrix.noOfRows && row - 1 < data.length; row++) {
            const cell = this.gridMatrix.getCell(row, this.selectedCol);
            if(!cell) continue;
            cell.data = data[row - 1];
        }
        this.redrawGrid();
    }

    /** Clear all cells in the selected column (excluding header row) */
    clearSelectedCol() {
        if (this.selectedCol < 1) return;
        for (let row = 1; row < this.gridMatrix.noOfRows; row++) {
            const cell = this.gridMatrix.getCell(row, this.selectedCol);
            if (cell) cell.data = "";
        }
        this.redrawGrid();
    }

    /** Draw the column selection highlight (call after drawing grid) */
    drawSelection(ctx: CanvasRenderingContext2D) {
        if (this.selectedCol < 1) return;
        for (let row = 1; row < this.gridMatrix.noOfRows; row++) {
            const cell = this.gridMatrix.getCell(row, this.selectedCol);
            if (!cell) continue;
            ctx.fillStyle = this.selectionColor + "20";
            ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
            ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
        }
        ctx.lineWidth = 1;
    }

    /** Redraws the entire grid with column selection highlight */
    redrawGrid() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.gridMatrix.drawGrid(this.ctx);
        this.drawSelection(this.ctx);
    }

    /** Attach to canvas for column header click selection */
    attachEvents(canvas: HTMLCanvasElement) {
        canvas.addEventListener("click", e => {
            const { x, y } = this.getMousePosition(e, canvas);
            // Find if click was in the column header (row 0)
            let totalX = 0;
            for (let col = 0; col < this.gridMatrix.columnWidths.length; col++) {
                totalX += this.gridMatrix.columnWidths[col];
                if (x < totalX) {
                    // Assume col header is row 0
                    let row0Height = this.gridMatrix.rowHeights[0];
                    if (y < row0Height) {
                        if (col > 0 && col < this.gridMatrix.noOfCols) {
                            this.selectCol(col);
                        }
                    }
                    break;
                }
            }
        });
    }

    /** Utility: Get mouse position relative to canvas */
    getMousePosition(e: MouseEvent, canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
}