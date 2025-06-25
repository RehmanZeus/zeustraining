import { CellSelector } from "./CellSelector";
import { GridMatrix } from "./GridMatrix";

export class RowSelector {
    ctx: CanvasRenderingContext2D;
    gridMatrix: GridMatrix;
    selectedRow = -1;
    cellSelector: CellSelector;
    selectionColor = '#f4b400';
    selectionBorderColor = '#e67c00';

    constructor(ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix, cellSelector: CellSelector) {
        this.ctx = ctx;
        this.cellSelector = cellSelector;
        this.gridMatrix = gridMatrix;
    }

    /** Select a row by index and redraw */
    selectRow(row: number) {
        if (row < 1 || row >= this.gridMatrix.noOfRows) return;
        this.selectedRow = row;
        this.redrawGrid();
    }

    /** Deselect any row */
    clearSelection() {
        this.selectedRow = -1;
        this.redrawGrid();
    }

    getSelectedRowData(): string[] | undefined {
        if (this.selectedRow < 1) return undefined;
        const data: string[] = [];
        for (let col = 1; col < this.gridMatrix.noOfCols; col++) {
            const cell = this.gridMatrix.getCell(this.selectedRow, col);
            data.push(cell.data || "");
        }
        return data;
    }

    setSelectedRowData(data: string[]) {
        if (this.selectedRow < 1) return;
        for (let col = 1; col < this.gridMatrix.noOfCols && col - 1 < data.length; col++) {
            this.gridMatrix.getCell(this.selectedRow, col).data = data[col - 1];
        }
        this.redrawGrid();
    }

    clearSelectedRow() {
        if (this.selectedRow < 1) return;
        for (let col = 1; col < this.gridMatrix.noOfCols; col++) {
            this.gridMatrix.getCell(this.selectedRow, col).data = "";
        }
        this.redrawGrid();
    }

    /** Draw the row selection highlight (call after drawing grid) */
    drawSelection(ctx: CanvasRenderingContext2D, scrollLeft = 0, scrollTop = 0) {
        if (this.selectedRow < 1) return;

        // 1. Highlight all body cells in the selected row
        for (let col = 1; col < this.gridMatrix.noOfCols; col++) {
            const cell = this.gridMatrix.getCell(this.selectedRow, col);
            ctx.fillStyle = this.selectionColor + "20";
            ctx.fillRect(cell.x - scrollLeft, cell.y - scrollTop, cell.width, cell.height);
            ctx.strokeRect(cell.x - scrollLeft, cell.y - scrollTop, cell.width, cell.height);
        }

        // 2. Highlight the header cell for this row (col 0) - sticky left!
        const headerCell = this.gridMatrix.getCell(this.selectedRow, 0);
        ctx.fillStyle = this.selectionColor + "44";
        ctx.fillRect(headerCell.x, headerCell.y - scrollTop, headerCell.width, headerCell.height);
        ctx.strokeRect(headerCell.x, headerCell.y - scrollTop, headerCell.width, headerCell.height);
    }

    /** Redraws the entire grid with row selection highlight */
    redrawGrid() {
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.gridMatrix.drawGrid(this.ctx, undefined, scrollLeft, scrollTop);
        this.drawSelection(this.ctx, scrollLeft, scrollTop);
    }

    attachEvents(canvas: HTMLCanvasElement) {
        canvas.addEventListener('click', (e) => {
            const { x, y } = this.getMousePosition(e, canvas);

            let totalY = 0;
            let rowIndex = -1;
            for (let row = 0; row < this.gridMatrix.rowHeights.length; row++) {
                totalY += this.gridMatrix.rowHeights[row];
                if (y < totalY) {
                    rowIndex = row;
                    break;
                }
            }

            const col0Width = this.gridMatrix.columnWidths[0];

            if (
                rowIndex === -1 ||
                x >= col0Width ||
                rowIndex >= this.gridMatrix.noOfRows ||
                rowIndex === 0
            ) {
                this.clearSelection();
                return;
            }

            if (this.selectedRow === rowIndex) {
                this.clearSelection();
            } else {
                this.selectRow(rowIndex);
            }
        });
    }

    getMousePosition(e: MouseEvent, canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        return {
            x: e.clientX - rect.left + container.scrollLeft,
            y: e.clientY - rect.top + container.scrollTop
        };
    }
}