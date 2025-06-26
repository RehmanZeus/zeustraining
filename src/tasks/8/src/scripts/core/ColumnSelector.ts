import { GridMatrix } from "./GridMatrix";
import { CellSelector } from "./CellSelector";

export class ColumnSelector {
    ctx: CanvasRenderingContext2D;
    gridMatrix: GridMatrix;
    selectedCol = -1;
    cellSelector?: CellSelector;

    selectionColor = "#0f9d58";
    selectionBorderColor = "#137e43";
    columnHeaderBg = "#107c41";
    columnHeaderText = "#fff";
    canvas: HTMLCanvasElement | null = null; // store if needed

    constructor(ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix, cellSelector: CellSelector) {
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;
        this.cellSelector = cellSelector;
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    isColumnHeader(e: MouseEvent): boolean {
        // Use coordinates relative to the canvas (NOT grid, NO scroll offset!)
        const rect = this.ctx.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

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
        // Y must be within the sticky header area (canvas top)
        return (colIndex !== -1 && y >= 0 && y < row0Height && colIndex < this.gridMatrix.noOfCols);
    }

    onClick(e: MouseEvent) {
        if (!this.canvas) return;
        const { x, y } = this.getMousePosition(e, this.canvas);
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
        if (colIndex === -1 || y >= row0Height || colIndex >= this.gridMatrix.noOfCols) {
            this.clearSelection();
            return;
        }
        if (this.selectedCol === colIndex) {
            this.clearSelection();
        } else {
            this.selectCol(colIndex);
        }
    }

    /** Select a column by index and redraw */
    selectCol(col: number) {
        if (col < 1 || col >= this.gridMatrix.noOfCols) return; // skip header col
        this.selectedCol = col;
        // Clear cell selection and any drag selection, and editing if possible
        if (this.cellSelector) {
            this.cellSelector.clearRangeSelection();
            this.cellSelector.selectedRow = -1;
            this.cellSelector.selectedCol = -1;
            this.cellSelector.isEditing = false;
            this.cellSelector.inputElement.style.display = 'none';
        }
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
        let firstCell, lastCell;
        for (let row = 1; row < this.gridMatrix.noOfRows; row++) {
            const cell = this.gridMatrix.getCell(row, this.selectedCol);
            const rowHeaderCells = this.gridMatrix.getCell(row, 0);

            if (!firstCell) firstCell = cell;
            lastCell = cell;

            ctx.fillStyle = this.selectionColor + "20";
            ctx.fillRect(cell.x - scrollLeft, cell.y - scrollTop, cell.width, cell.height);
            ctx.strokeRect(cell.x - scrollLeft, cell.y - scrollTop, cell.width, cell.height);

            // Row header bg
            ctx.save();
            ctx.fillStyle = "#caead8";
            ctx.fillRect(rowHeaderCells.x - scrollLeft, rowHeaderCells.y, rowHeaderCells.width, rowHeaderCells.height);

            // Row header text
            ctx.font = "14px Arial";
            ctx.fillStyle = "#0f7072";
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.fillText(
                rowHeaderCells.data || "",
                rowHeaderCells.x + rowHeaderCells.width - 8 - scrollLeft,
                rowHeaderCells.y + rowHeaderCells.height - 4
            );

            // Row header right border
            ctx.strokeStyle = "#107c41";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(rowHeaderCells.x + rowHeaderCells.width - scrollLeft, rowHeaderCells.y);
            ctx.lineTo(rowHeaderCells.x + rowHeaderCells.width - scrollLeft, rowHeaderCells.y + rowHeaderCells.height);
            ctx.stroke();
            ctx.restore();
        }

        // 2. Highlight the header cell for this column (row 0) - sticky top!
        const headerCell = this.gridMatrix.getCell(0, this.selectedCol);
        ctx.save();
        // Background
        ctx.fillStyle = this.columnHeaderBg;
        ctx.fillRect(headerCell.x - scrollLeft, headerCell.y, headerCell.width, headerCell.height);

        // Text
        ctx.font = "14px Arial";
        ctx.fillStyle = this.columnHeaderText;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
            headerCell.data || "",
            headerCell.x - scrollLeft + headerCell.width / 2,
            headerCell.y + headerCell.height / 2
        );

        // Borders (left & right)
        ctx.strokeStyle = this.selectionBorderColor;
        ctx.lineWidth = 2;

        // Left border
        ctx.beginPath();
        ctx.moveTo(headerCell.x - scrollLeft, headerCell.y);
        ctx.lineTo(headerCell.x - scrollLeft, headerCell.y + headerCell.height);
        ctx.stroke();

        // Right border
        ctx.beginPath();
        ctx.moveTo(headerCell.x - scrollLeft + headerCell.width, headerCell.y);
        ctx.lineTo(headerCell.x - scrollLeft + headerCell.width, headerCell.y + headerCell.height);
        ctx.stroke();

        ctx.restore();

        // 3. Draw border around the entire selected column (from header to last cell)
        if (firstCell && lastCell) {
            ctx.save();
            ctx.strokeStyle = this.selectionBorderColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            // Rectangle from header top to last cell bottom
            ctx.rect(
                headerCell.x - scrollLeft,
                headerCell.y,
                headerCell.width,
                (lastCell.y + lastCell.height) - headerCell.y
            );
            ctx.stroke();
            ctx.restore();
        }
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