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
            this.gridMatrix.getCell(row, this.selectedCol).data = data[row - 1];
        }
        this.redrawGrid();
    }

    /** Clear all cells in the selected column (excluding header row) */
    clearSelectedCol() {
        if (this.selectedCol < 1) return;
        for (let row = 1; row < this.gridMatrix.noOfRows; row++) {
            this.gridMatrix.getCell(row, this.selectedCol).data = "";
        }
        this.redrawGrid();
    }

    /** Draw the column selection highlight (call after drawing grid) */
    drawSelection(ctx: CanvasRenderingContext2D, scrollLeft = 0, scrollTop = 0) {
        if (this.selectedCol < 1) return;

        // 1. Highlight all body cells in the selected column
        for (let row = 1; row < this.gridMatrix.noOfRows; row++) {
            const cell = this.gridMatrix.getCell(row, this.selectedCol);
            ctx.fillStyle = this.selectionColor + "20";
            ctx.fillRect(cell.x - scrollLeft, cell.y - scrollTop, cell.width, cell.height);
            ctx.strokeRect(cell.x - scrollLeft, cell.y - scrollTop, cell.width, cell.height);
        }

        // 2. Highlight the header cell for this column (row 0) - sticky top!
        const headerCell = this.gridMatrix.getCell(0, this.selectedCol);
        ctx.fillStyle = this.selectionColor + "44";
        ctx.fillRect(headerCell.x - scrollLeft, headerCell.y, headerCell.width, headerCell.height);
        ctx.strokeRect(headerCell.x - scrollLeft, headerCell.y, headerCell.width, headerCell.height);
    }

    /** Redraws the entire grid with column selection highlight */
    redrawGrid() {
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;
        const viewport = this.gridMatrix.getViewportBounds(scrollLeft, scrollTop, viewportWidth, viewportHeight);

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Pass the computed viewport!
        this.gridMatrix.drawGrid(this.ctx, viewport, scrollLeft, scrollTop);
        this.drawSelection(this.ctx, scrollLeft, scrollTop);
    }

    /** Attach to canvas for column header click selection */
    attachEvents(canvas: HTMLCanvasElement) {
        canvas.addEventListener("click", e => {
            const { x, y } = this.getMousePosition(e, canvas);

            let totalX = 0;
            let colIndex = -1;
            for (let col = 0; col < this.gridMatrix.columnWidths.length; col++) {
                totalX += this.gridMatrix.columnWidths[col];
                if (x < totalX) {
                    colIndex = col;
                    break;
                }
            }

            const row0Height = this.gridMatrix.rowHeights[0];

            // If click is not in a column header, clear selection
            if (colIndex === -1 || y >= row0Height || colIndex >= this.gridMatrix.noOfCols) {
                this.clearSelection();
                return;
            }

            // If click is in a column header, toggle selection
            if (this.selectedCol === colIndex) {
                this.clearSelection();
            } else {
                this.selectCol(colIndex);
            }
        });
    }

    /** Utility: Get mouse position relative to canvas (with scroll offset!) */
    getMousePosition(e: MouseEvent, canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        return {
            x: e.clientX - rect.left + container.scrollLeft,
            y: e.clientY - rect.top + container.scrollTop
        };
    }
}