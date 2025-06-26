import { CellSelector } from "./CellSelector";
import { GridMatrix } from "./GridMatrix";

export class RowSelector {
    ctx: CanvasRenderingContext2D;
    gridMatrix: GridMatrix;
    selectedRow = -1;
    selectedRows: number[] = [];
    cellSelector: CellSelector;
    selectionColor = "#0f9d58";
    selectionBorderColor = "#137e43";
    rowHeaderBg = "#107c41";
    rowHeaderText = "#fff";
    canvas: HTMLCanvasElement | null = null;

    constructor(ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix, cellSelector: CellSelector) {
        this.ctx = ctx;
        this.cellSelector = cellSelector;
        this.gridMatrix = gridMatrix;
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    /** Returns true if the mouse event is on a row header cell (excluding col 0, row 0) */
    isRowHeader(e: MouseEvent): boolean {
        const rect = this.ctx.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

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
        // X must be within the sticky row header area (canvas left)
        return (
            rowIndex !== -1 &&
            x >= 0 &&
            x < col0Width &&
            rowIndex < this.gridMatrix.noOfRows &&
            rowIndex > 0 // skip header row
        );
    }

    /** Handles a click on the row header area */
    onClick(e: MouseEvent) {
        if (!this.canvas) return;
        const { x, y } = this.getMousePosition(e, this.canvas);

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

        // Support Ctrl+Click for multi-selection
        if (e.ctrlKey || e.metaKey) { // metaKey for MacOS Cmd
            const idx = this.selectedRows.indexOf(rowIndex);
            if (idx === -1) {
                this.selectedRows.push(rowIndex);
            } else {
                this.selectedRows.splice(idx, 1); // Deselect if already selected
            }
            this.selectedRow = rowIndex;
            // Clear cell selection and any drag selection, and editing if possible
            this.cellSelector.clearRangeSelection();
            this.cellSelector.selectedRow = -1;
            this.cellSelector.selectedCol = -1;
            this.cellSelector.isEditing = false;
            this.cellSelector.inputElement.style.display = 'none';
            this.redrawGrid();
            return;
        }

        // Single row selection (no Ctrl)
        this.selectedRows = [rowIndex];
        this.selectedRow = rowIndex;
        this.cellSelector.clearRangeSelection();
        this.cellSelector.selectedRow = -1;
        this.cellSelector.selectedCol = -1;
        this.cellSelector.isEditing = false;
        this.cellSelector.inputElement.style.display = 'none';
        this.redrawGrid();
    }

    /** Select a row by index and redraw */
    selectRow(row: number) {
        if (row < 1 || row >= this.gridMatrix.noOfRows) return;
        this.selectedRow = row;
        this.selectedRows = [row];
        // Clear cell selection and any drag selection
        this.cellSelector.clearRangeSelection();
        this.cellSelector.selectedRow = -1;
        this.cellSelector.selectedCol = -1;
        this.cellSelector.isEditing = false;
        this.cellSelector.inputElement.style.display = 'none';
        this.redrawGrid();
    }

    /** Deselect any row */
    clearSelection() {
        this.selectedRow = -1;
        this.selectedRows = [];
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
        if (!this.selectedRows || this.selectedRows.length === 0) return;

        for (const selectedRow of this.selectedRows) {
            let firstCell = null, lastCell = null;
            for (let col = 1; col < this.gridMatrix.noOfCols; col++) {
                const cell = this.gridMatrix.getCell(selectedRow, col);
                const colHeaderCell = this.gridMatrix.getCell(0, col);

                if (!firstCell) firstCell = cell;
                lastCell = cell;

                // Highlight all body cells in the selected row
                ctx.save();
                ctx.fillStyle = this.selectionColor + "20";
                ctx.fillRect(cell.x - scrollLeft, cell.y - scrollTop, cell.width, cell.height);
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#e0e0e0";
                ctx.strokeRect(
                    Math.floor(cell.x - scrollLeft) + 0.5,
                    Math.floor(cell.y - scrollTop) + 0.5,
                    cell.width, cell.height
                );
                ctx.restore();

                // Column header background
                ctx.save();
                ctx.fillStyle = "#caead8";
                ctx.fillRect(colHeaderCell.x - scrollLeft, colHeaderCell.y, colHeaderCell.width, colHeaderCell.height);
                // Thin border for header cell
                ctx.strokeStyle = "#e0e0e0";
                ctx.lineWidth = 1;
                ctx.strokeRect(
                    Math.floor(colHeaderCell.x - scrollLeft) + 0.5,
                    Math.floor(colHeaderCell.y) + 0.5,
                    colHeaderCell.width, colHeaderCell.height
                );
                // Column header text (green, bold)
                ctx.font = "bold 14px Arial";
                ctx.fillStyle = "#107c41";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(
                    colHeaderCell.data || "",
                    colHeaderCell.x - scrollLeft + colHeaderCell.width / 2,
                    colHeaderCell.y + colHeaderCell.height / 2
                );
                // Thick green bottom border
                ctx.strokeStyle = this.selectionBorderColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(
                    colHeaderCell.x - scrollLeft,
                    colHeaderCell.y + colHeaderCell.height - 1
                );
                ctx.lineTo(
                    colHeaderCell.x - scrollLeft + colHeaderCell.width,
                    colHeaderCell.y + colHeaderCell.height - 1
                );
                ctx.stroke();
                ctx.restore();
            }

            // Highlight the header cell for this row (col 0)
            const headerCell = this.gridMatrix.getCell(selectedRow, 0);
            ctx.save();
            // Background
            ctx.fillStyle = this.rowHeaderBg;
            ctx.fillRect(headerCell.x, headerCell.y - scrollTop, headerCell.width, headerCell.height);

            // Thin border for row header cell
            ctx.strokeStyle = "#e0e0e0";
            ctx.lineWidth = 1;
            ctx.strokeRect(
                Math.floor(headerCell.x) + 0.5,
                Math.floor(headerCell.y - scrollTop) + 0.5,
                headerCell.width, headerCell.height
            );

            // Text (white, bold, right-aligned, bottom)
            ctx.font = "bold 14px Arial";
            ctx.fillStyle = this.rowHeaderText;
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.fillText(
                headerCell.data || "",
                headerCell.x + headerCell.width - 8,
                headerCell.y + headerCell.height - 4 - scrollTop
            );

            // Borders (top & bottom, thick, green)
            ctx.strokeStyle = this.selectionBorderColor;
            ctx.lineWidth = 2;
            // Top border
            ctx.beginPath();
            ctx.moveTo(headerCell.x, headerCell.y - scrollTop + 1);
            ctx.lineTo(headerCell.x + headerCell.width, headerCell.y - scrollTop + 1);
            ctx.stroke();
            // Bottom border
            ctx.beginPath();
            ctx.moveTo(headerCell.x, headerCell.y + headerCell.height - scrollTop - 1);
            ctx.lineTo(headerCell.x + headerCell.width, headerCell.y + headerCell.height - scrollTop - 1);
            ctx.stroke();
            ctx.restore();

            // Draw border around the entire selected row (from header to last cell)
            if (firstCell && lastCell) {
                ctx.save();
                ctx.strokeStyle = this.selectionBorderColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    Math.floor(headerCell.x) + 0.5,
                    Math.floor(headerCell.y - scrollTop) + 0.5,
                    (lastCell.x + lastCell.width) - headerCell.x,
                    headerCell.height
                );
                ctx.restore();
            }
        }
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