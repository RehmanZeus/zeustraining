import { GridMatrix } from "./GridMatrix";

export class RowSelector {
    ctx: CanvasRenderingContext2D;
    gridMatrix: GridMatrix;
    selectedRow = -1;

    selectionColor = '#f4b400';
    selectionBorderColor = '#e67c00';

    constructor(ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix) {
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;
    }

    /** Select a row by index and redraw */
    selectRow(row: number) {
        if (row < 1 || row >= this.gridMatrix.noOfRows) return; // skip header row
        this.selectedRow = row;
        this.redrawGrid();
       
    }

    /** Deselect any row */
    clearSelection() {
        this.selectedRow = -1;
        this.redrawGrid();
    }

    /** Get the data array for the selected row (excluding header col) */
    getSelectedRowData(): string[] | undefined {
        if (this.selectedRow < 1) return undefined;
        return this.gridMatrix.grid[this.selectedRow]
            .slice(1) // skip col 0 header
            .map(cell => cell.data || "");
    }

    /** Set the data for the selected row (excluding header col) */
    setSelectedRowData(data: string[]) {
        if (this.selectedRow < 1) return;
        const row = this.gridMatrix.grid[this.selectedRow];
        for (let col = 1; col < row.length && col - 1 < data.length; col++) {
            row[col].data = data[col - 1];
        }
        this.redrawGrid();
    }

    /** Clear all cells in the selected row (excluding header col) */
    clearSelectedRow() {
        if (this.selectedRow < 1) return;
        const row = this.gridMatrix.grid[this.selectedRow];
        for (let col = 1; col < row.length; col++) {
            row[col].data = "";
        }
        this.redrawGrid();
    }

    /** Draw the row selection highlight (call after drawing grid) */
    drawSelection() {
        if (this.selectedRow < 1) return;
        const row = this.gridMatrix.grid[this.selectedRow];
        for (let col = 1; col < row.length; col++) {
            const cell = row[col];
            this.ctx.fillStyle = this.selectionColor + "20";
            this.ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
            // this.ctx.strokeStyle = this.selectionBorderColor;
            // this.ctx.lineWidth = 2;
            this.ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
        }
        this.ctx.lineWidth = 1;
    }

    /** Redraws the entire grid with row selection highlight */
    redrawGrid() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.gridMatrix.drawGrid(this.ctx);
        this.drawSelection();
    }

    /** Attach to canvas for row header click selection */
    attachEvents(canvas: HTMLCanvasElement) {
        canvas.addEventListener('click', (e) => {
            const { x, y } = this.getMousePosition(e, canvas);
            // Find if click was in the row header (col 0)
            let totalY = 0;
            for (let row = 0; row < this.gridMatrix.rowHeights.length; row++) {
                totalY += this.gridMatrix.rowHeights[row];
                if (y < totalY) {
                    // Assume row header is col 0
                    let col0Width = this.gridMatrix.columnWidths[0];
                    if (x < col0Width) {
                        if (row > 0 && row < this.gridMatrix.noOfRows) {
                            this.selectRow(row);
                        }
                    }
                    break;
                }
            }
        });
        // You can add keyboard navigation if desired
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