import { CellSelector } from "./CellSelector.js";
import { CommandManager } from "./commands/CommandManager.js";
import { SelectRowCommand } from "./commands/SelectRowCommand.js";
import { GridCell } from "./GridCell.js";
import { GridMatrix } from "./GridMatrix.js";

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
    commandManager?: CommandManager;

    /**
     * Creates an instance of the RowSelector.
     * @param ctx The canvas rendering context where the grid is drawn.
     * @param gridMatrix The GridMatrix instance for managing grid data.
     * @param cellSelector The CellSelector instance for managing cell selection.
     */
    constructor(ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix, cellSelector: CellSelector) {
        this.ctx = ctx;
        this.cellSelector = cellSelector;
        this.gridMatrix = gridMatrix;
    }

    /**
     * Sets the canvas element for the RowSelector.
     * @param canvas The HTML canvas element where the grid is rendered.
     */
    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    /**
     * Sets the CommandManager instance for executing commands.
     * @param cmdManager The CommandManager instance to use for command execution.
     */
    setCommandManager(cmdManager: CommandManager) {
        this.commandManager = cmdManager;
    }

    /**
     * Checks if the mouse event is on a row header cell (excluding col 0, row 0).
     * @param e The mouse event to check.
     * @returns True if the mouse event is on a row header cell, false otherwise.
     */
    isRowHeader(e: MouseEvent): boolean {
        if (!this.canvas) return false;
        const rect = this.canvas.getBoundingClientRect();
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
        return (
            rowIndex !== -1 &&
            x >= 0 &&
            x < col0Width &&
            rowIndex < this.gridMatrix.noOfRows &&
            rowIndex > 0 // skip header row
        );
    }

    /**
     * Handles click events on the canvas to select rows.
     * @param e The mouse event to handle.
     * @returns 
     */
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

        const oldSelectedRows = [...this.selectedRows];

        let newSelectedRows: number[];
        if (e.ctrlKey || e.metaKey) {
            // Calculate newSelectedRows based on current selection
            if (this.selectedRows.includes(rowIndex)) {
                newSelectedRows = this.selectedRows.filter(r => r !== rowIndex);
            } else {
                newSelectedRows = [...this.selectedRows, rowIndex];
            }
        } else {
            newSelectedRows = [rowIndex];
        }

        if (this.commandManager) {
            this.commandManager.executeCommand(
                new SelectRowCommand(this, oldSelectedRows, newSelectedRows)
            );
        } else {
            this.selectedRows = newSelectedRows;
            this.selectedRow = newSelectedRows.length ? newSelectedRows[newSelectedRows.length - 1] : -1;
            this.cellSelector.clearRangeSelection();
            this.cellSelector.selectedRow = -1;
            this.cellSelector.selectedCol = -1;
            this.cellSelector.isEditing = false;
            this.cellSelector.inputElement.style.display = 'none';
            this.redrawGrid();
            return;
        }
    }

    /**
     * Selects a specific row by index.
     * @param row The row index to select (1-based).
     */
    selectRow(row: number) {
        if (row < 1 || row >= this.gridMatrix.noOfRows) return;
        this.selectedRow = row;
        this.selectedRows = [row];
        this.cellSelector.clearRangeSelection();
        this.cellSelector.selectedRow = -1;
        this.cellSelector.selectedCol = -1;
        this.cellSelector.isEditing = false;
        this.cellSelector.inputElement.style.display = 'none';
        this.redrawGrid();
    }

    /**
     * Clears the current row selection.
     */
    clearSelection() {
        this.selectedRow = -1;
        this.selectedRows = [];
        this.redrawGrid();
    }

    /**
     * Gets the data for the currently selected row.
     * @returns An array of cell data for the selected row, or undefined if no row is selected.
     */
    getSelectedRowData(): string[] | undefined {
        if (this.selectedRow < 1) return undefined;
        const data: string[] = [];
        for (let col = 1; col < this.gridMatrix.noOfCols; col++) {
            const cell = this.gridMatrix.getCell(this.selectedRow, col);
            data.push(cell.data || "");
        }
        return data;
    }

    /**
     * Sets the data for the currently selected row.
     * @param data An array of cell data to set in the selected row.
     */
    setSelectedRowData(data: string[]) {
        if (this.selectedRow < 1) return;
        for (let col = 1; col < this.gridMatrix.noOfCols && col - 1 < data.length; col++) {
            this.gridMatrix.getCell(this.selectedRow, col).data = data[col - 1];
        }
        this.redrawGrid();
    }

    /**
     * Clears the currently selected row.
     */
    clearSelectedRow() {
        if (this.selectedRow < 1) return;
        for (let col = 1; col < this.gridMatrix.noOfCols; col++) {
            this.gridMatrix.getCell(this.selectedRow, col).data = "";
        }
        this.redrawGrid();
    }

    /**
     * Draws the selection for the currently selected rows.
     * @param ctx The canvas rendering context where the grid is drawn.
     * @param scrollLeft The horizontal scroll position.
     * @param scrollTop The vertical scroll position.
     * @returns 
     */
    drawSelection(ctx: CanvasRenderingContext2D, scrollLeft = 0, scrollTop = 0) {
        if (!this.selectedRows || this.selectedRows.length === 0) return;

        const container = document.getElementById('excel-container') as HTMLDivElement;
        const currentScrollLeft = scrollLeft || container.scrollLeft;
        const currentScrollTop = scrollTop || container.scrollTop;

        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;
        const viewport = this.gridMatrix.getViewportBounds(currentScrollLeft, currentScrollTop, viewportWidth, viewportHeight);

        for (const selectedRow of this.selectedRows) {
            // Get row position
            const headerRect = GridCell.getCellRect(selectedRow, 0, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);

            // Skip drawing if row is completely out of view
            const rowTop = headerRect.y - currentScrollTop;
            const rowBottom = rowTop + headerRect.height;
            if (rowBottom < 0 || rowTop > viewportHeight) {
                continue; // Row is not visible, skip drawing
            }

            // 1. Draw STICKY row header highlight (scrolls vertically, fixed at left)
            const headerCell = this.gridMatrix.getCell(selectedRow, 0);

            ctx.save();
            ctx.fillStyle = this.rowHeaderBg;
            ctx.fillRect(0, headerRect.y - currentScrollTop, headerRect.width, headerRect.height);

            ctx.font = "bold 14px Arial";
            ctx.fillStyle = this.rowHeaderText;
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.fillText(
                headerCell.data || "",
                headerRect.width - 8,
                headerRect.y - currentScrollTop + headerRect.height - 4
            );

            // Row header borders
            ctx.strokeStyle = this.selectionBorderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(0, headerRect.y - currentScrollTop, headerRect.width, headerRect.height);
            ctx.restore();

            // 2. Draw visible data cell highlights (scroll in both directions)
            for (let col = Math.max(1, viewport.startCol); col < viewport.endCol; col++) {
                const rect = GridCell.getCellRect(selectedRow, col, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);

                ctx.save();
                ctx.fillStyle = this.selectionColor + "20";
                ctx.fillRect(rect.x - currentScrollLeft, rect.y - currentScrollTop, rect.width, rect.height);
                ctx.strokeStyle = this.selectionBorderColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(rect.x - currentScrollLeft, rect.y - currentScrollTop, rect.width, rect.height);
                ctx.restore();
            }

            // 3. Draw sticky column header highlights for visible columns
            for (let col = Math.max(1, viewport.startCol); col < viewport.endCol; col++) {
                const colHeaderRect = GridCell.getCellRect(0, col, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);
                const colHeaderCell = this.gridMatrix.getCell(0, col);

                ctx.save();
                ctx.fillStyle = "#caead8";
                ctx.fillRect(colHeaderRect.x - currentScrollLeft, 0, colHeaderRect.width, colHeaderRect.height);

                ctx.font = "bold 14px Arial";
                ctx.fillStyle = "#107c41";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(
                    colHeaderCell.data || "",
                    colHeaderRect.x - currentScrollLeft + colHeaderRect.width / 2,
                    colHeaderRect.height / 2
                );

                // Thick green bottom border for column headers
                ctx.strokeStyle = this.selectionBorderColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(colHeaderRect.x - currentScrollLeft, colHeaderRect.height - 1);
                ctx.lineTo(colHeaderRect.x - currentScrollLeft + colHeaderRect.width, colHeaderRect.height - 1);
                ctx.stroke();
                ctx.restore();
            }

            // 4. Draw overall row selection border (optional visual enhancement)
            ctx.save();
            ctx.strokeStyle = this.selectionBorderColor;
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]); // Dashed border for the full row

            // Draw border from row header to right edge of visible area
            const leftX = 0;
            const rightX = Math.min(
                this.gridMatrix.columnWidths.slice(0, viewport.endCol).reduce((a, b) => a + b, 0) - currentScrollLeft,
                viewportWidth
            );

            ctx.beginPath();
            ctx.rect(leftX, headerRect.y - currentScrollTop, rightX - leftX, headerRect.height);
            ctx.stroke();
            ctx.restore();
        }

        // 5. REDRAW CORNER CELL (0,0) to ensure it's always on top
        this.drawCornerCell(ctx);
    }

    // Add this new method to RowSelector
    private drawCornerCell(ctx: CanvasRenderingContext2D) {
        const cornerWidth = this.gridMatrix.columnWidths[0];
        const cornerHeight = this.gridMatrix.rowHeights[0];

        ctx.save();
        // Corner cell background
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(0, 0, cornerWidth, cornerHeight);

        // Corner cell border
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, cornerWidth, cornerHeight);

        ctx.restore();
    }

    /**
     * Redraws the grid and selections based on the current scroll position.
     * This method clears the canvas, redraws the grid, and applies any selections.
     */
    redrawGrid() {
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;

        const viewport = this.gridMatrix.getViewportBounds(scrollLeft, scrollTop, viewportWidth, viewportHeight);

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw grid first
        this.gridMatrix.drawGrid(this.ctx, viewport, scrollLeft, scrollTop);

        // Draw row selection with current scroll values
        this.drawSelection(this.ctx, scrollLeft, scrollTop);

        // Also draw other selections if they exist
        if (this.cellSelector) {
            this.cellSelector.drawSelection(this.ctx, scrollLeft, scrollTop);
        }
    }

    /**
     * Gets the mouse position relative to the canvas.
     * @param e The mouse event to get the position from.
     * This method calculates the mouse position relative to the canvas, accounting for any scrolling.
     * @param canvas The canvas element being interacted with.
     * @returns The mouse position relative to the canvas.
     */
    getMousePosition(e: MouseEvent, canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top + container.scrollTop
        };
    }
}