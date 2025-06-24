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
        const data: string[] = [];
        for (let col = 1; col < this.gridMatrix.noOfCols; col++) {
            const cell = this.gridMatrix.getCell(this.selectedRow, col);
            data.push(cell.data || "");
        }
        return data;
    }

    /** Set the data for the selected row (excluding header col) */
    setSelectedRowData(data: string[]) {
        if (this.selectedRow < 1) return;
        for (let col = 1; col < this.gridMatrix.noOfCols && col - 1 < data.length; col++) {
            this.gridMatrix.getCell(this.selectedRow, col).data = data[col - 1];
        }
        this.redrawGrid();
    }

    /** Clear all cells in the selected row (excluding header col) */
    clearSelectedRow() {
        if (this.selectedRow < 1) return;
        for (let col = 1; col < this.gridMatrix.noOfCols; col++) {
            this.gridMatrix.getCell(this.selectedRow, col).data = "";
        }
        this.redrawGrid();
    }

    /** Draw the row selection highlight (call after drawing grid) */
    drawSelection(ctx: CanvasRenderingContext2D) {
        if (this.selectedRow < 1) return;
        for (let col = 1; col < this.gridMatrix.noOfCols; col++) {
            const cell = this.gridMatrix.getCell(this.selectedRow, col);
            ctx.fillStyle = this.selectionColor + "20";
            ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
            ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
        }
        ctx.lineWidth = 1;
    }

    /** Redraws the entire grid with row selection highlight */
    redrawGrid() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.gridMatrix.drawGrid(this.ctx);
        this.drawSelection(this.ctx);
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