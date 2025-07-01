import { GridMatrix } from "./GridMatrix.js";
import { CellSelector } from "./CellSelector.js";
import { GridCell } from "./GridCell.js";

/**
 * ColumnSelector manages column selection in the grid,
 * allowing single or multi-column selection, and provides methods
 * to manipulate selected columns.
 */
export class ColumnSelector {

    /** Canvas rendering context for drawing */
    ctx: CanvasRenderingContext2D;
    /** The grid matrix containing all cells */
    gridMatrix: GridMatrix;
    /** Currently selected column index, -1 if none */
    selectedCol = -1;
    /** Cell selector instance for managing cell selections */
    cellSelector?: CellSelector;
    /** Currently selected columns */
    selectedCols: number[] = [];
    /** Color for selected columns */
    selectionColor = "#0f9d58";
    /** Border color for selected columns */
    selectionBorderColor = "#137e43";
    /** Background color for column headers */
    columnHeaderBg = "#107c41";
    /** Text color for column headers */
    columnHeaderText = "#fff";
    /** Canvas element for drawing */
    canvas: HTMLCanvasElement | null = null;

    /**
     * Constructor for ColumnSelector.
     * @param ctx Canvas rendering context to draw on
     * @param gridMatrix The grid matrix containing all cells
     * @param cellSelector The cell selector instance for managing cell selections
     */
    constructor(ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix, cellSelector: CellSelector) {
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;
        this.cellSelector = cellSelector;
    }

    /**
     * Sets the canvas element for drawing.
     * @param canvas The canvas element to set for drawing
     */
    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }


    /**
     * Checks if the mouse event occurred on a column header.
     * @param e Mouse event to check if it occurred on a column header
     * @returns True if the mouse event is on a column header, false otherwise.
     */
    isColumnHeader(e: MouseEvent): boolean {
        if (!this.canvas) return false;
        const rect = this.canvas.getBoundingClientRect();
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
        return (colIndex !== -1 && y >= 0 && y < row0Height && colIndex < this.gridMatrix.noOfCols);
    }

    /**
     * Handles the click event to select a column.
     * @param e MouseEvent that triggered the click
     * @returns void
     */
    onClick(e: MouseEvent) {
        if (!this.canvas) return;
        const { x, y } = this.getMousePosition(e, this.canvas);

        // Find col
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

        // Support Ctrl+Click for multi-selection
        if (e.ctrlKey || e.metaKey) {
            const idx = this.selectedCols.indexOf(colIndex);
            if (idx === -1) {
                this.selectedCols.push(colIndex);
            } else {
                this.selectedCols.splice(idx, 1);
            }
            this.selectedCol = colIndex;
            if (this.cellSelector) {
                this.cellSelector.clearRangeSelection();
                this.cellSelector.selectedRow = -1;
                this.cellSelector.selectedCol = -1;
                this.cellSelector.isEditing = false;
                this.cellSelector.inputElement.style.display = 'none';
            }
            this.redrawGrid();
            return;
        }

        // Single column selection (no Ctrl)
        this.selectedCols = [colIndex];
        this.selectedCol = colIndex;
        if (this.cellSelector) {
            this.cellSelector.clearRangeSelection();
            this.cellSelector.selectedRow = -1;
            this.cellSelector.selectedCol = -1;
            this.cellSelector.isEditing = false;
            this.cellSelector.inputElement.style.display = 'none';
        }
        this.redrawGrid();
    }

    /**
     * @param col The column index to select (1-based).
     *            Note: 0 is reserved for row headers, so valid columns start from 1.
     * @returns void
     */
    selectCol(col: number) {
        if (col < 1 || col >= this.gridMatrix.noOfCols) return;
        this.selectedCol = col;
        if (this.cellSelector) {
            this.cellSelector.clearRangeSelection();
            this.cellSelector.selectedRow = -1;
            this.cellSelector.selectedCol = -1;
            this.cellSelector.isEditing = false;
            this.cellSelector.inputElement.style.display = 'none';
        }
        this.redrawGrid();
    }

    /**
     * Clears the current column selection.
     * @returns void
     */
    clearSelection() {
        this.selectedCol = -1;
        this.selectedCols = [];
        this.redrawGrid();
    }

    /**
     * 
     * @returns The data of the currently selected column, or undefined if no column is selected.
     *          Returns undefined if the selected column is not valid (col < 1).
     */
    getSelectedColData(): string[] | undefined {
        if (this.selectedCol < 1) return undefined;
        const col = this.selectedCol;
        const data: string[] = [];
        for (let row = 1; row < this.gridMatrix.noOfRows; row++) {
            const cell = this.gridMatrix.getCell(row, col);
            data.push(cell?.data || "");
        }
        return data;
    }

    /**
     * 
     * @param data Array of strings to set as data for the selected column.
     *             The length of the array should match the number of rows in the grid (excluding the header row).
     *             If the array is shorter than the number of rows, only the first N rows will be set.
     *             If the array is longer than the number of rows, only the first N elements will be used.
     * @returns void
     */
    setSelectedColData(data: string[]) {
        if (this.selectedCol < 1) return;
        for (let row = 1; row < this.gridMatrix.noOfRows && row - 1 < data.length; row++) {
            this.gridMatrix.getCell(row, this.selectedCol).data = data[row - 1];
        }
        this.redrawGrid();
    }

    /**
     * Clears the data in the currently selected column.
     * @returns void
     */
    clearSelectedCol() {
        if (this.selectedCol < 1) return;
        for (let row = 1; row < this.gridMatrix.noOfRows; row++) {
            this.gridMatrix.getCell(row, this.selectedCol).data = "";
        }
        this.redrawGrid();
    }

    /**
        * Draws the selection rectangle for the currently selected columns.
        * @param ctx Canvas rendering context to draw the selection
        * @param scrollLeft Horizontal scroll position
        * @param scrollTop Vertical scroll position
        * @returns void
        */
    drawSelection(ctx: CanvasRenderingContext2D, scrollLeft = 0, scrollTop = 0) {
        if (!this.selectedCols || this.selectedCols.length === 0) return;

        // Get FRESH scroll values if not provided
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const currentScrollLeft = scrollLeft || container.scrollLeft;
        const currentScrollTop = scrollTop || container.scrollTop;

        console.log(`Drawing column selection with scroll: ${currentScrollLeft}, ${currentScrollTop}`); // Debug

        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;
        const viewport = this.gridMatrix.getViewportBounds(currentScrollLeft, currentScrollTop, viewportWidth, viewportHeight);

        for (const selectedCol of this.selectedCols) {
            // Use currentScrollLeft and currentScrollTop everywhere
            const headerRect = GridCell.getCellRect(0, selectedCol, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);

            // 1. Column header (sticky at top, scrolls horizontally)
            const headerCell = this.gridMatrix.getCell(0, selectedCol);
            ctx.save();
            ctx.fillStyle = this.columnHeaderBg;
            ctx.fillRect(headerRect.x - currentScrollLeft, 0, headerRect.width, headerRect.height);

            ctx.font = "14px Arial";
            ctx.fillStyle = this.columnHeaderText;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                headerCell.data || "",
                headerRect.x - currentScrollLeft + headerRect.width / 2,
                headerRect.height / 2
            );

            ctx.strokeStyle = this.selectionBorderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(headerRect.x - currentScrollLeft, 0, headerRect.width, headerRect.height);
            ctx.restore();

            // 2. Data cells (scroll in both directions)
            // 2. Data cells (scroll in both directions)
            for (let row = Math.max(1, viewport.startRow); row < viewport.endRow; row++) {
                const rect = GridCell.getCellRect(row, selectedCol, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);

                ctx.save();
                ctx.fillStyle = this.selectionColor + "20";
                ctx.fillRect(rect.x - currentScrollLeft, rect.y - currentScrollTop, rect.width, rect.height);

                // Only draw top, left, right borders
                const x = rect.x - currentScrollLeft;
                const y = rect.y - currentScrollTop;
                const w = rect.width;
                const h = rect.height;

                ctx.strokeStyle = this.selectionBorderColor;
                ctx.lineWidth = 1;
                ctx.beginPath();

                // Left
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + h);
                // Right
                ctx.moveTo(x + w, y);
                ctx.lineTo(x + w, y + h);
                // (No bottom)
                ctx.stroke();

                ctx.restore();
            }
            // 3. Row headers (sticky at left, scroll vertically)
            for (let row = Math.max(1, viewport.startRow); row < viewport.endRow; row++) {
                const rowHeaderRect = GridCell.getCellRect(row, 0, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);
                const rowHeaderCell = this.gridMatrix.getCell(row, 0);

                ctx.save();
                ctx.fillStyle = "#caead8";
                ctx.fillRect(0, rowHeaderRect.y - currentScrollTop, rowHeaderRect.width, rowHeaderRect.height);

                ctx.font = "14px Arial";
                ctx.fillStyle = "#0f7072";
                ctx.textAlign = "right";
                ctx.textBaseline = "bottom";
                ctx.fillText(
                    rowHeaderCell.data || "",
                    rowHeaderRect.width - 8,
                    rowHeaderRect.y - currentScrollTop + rowHeaderRect.height - 4
                );

                // Draw bottom border
                ctx.beginPath();
                ctx.moveTo(0, rowHeaderRect.y - currentScrollTop + rowHeaderRect.height - 1);
                ctx.lineTo(rowHeaderRect.width, rowHeaderRect.y - currentScrollTop + rowHeaderRect.height - 1);
                ctx.strokeStyle = "#f5f5f5";
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.restore();
            }
        }
    }


    /**
     * Redraws the grid and its selections.
     */
    redrawGrid() {
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;

        console.log(`ColumnSelector redraw: ${scrollLeft}, ${scrollTop}`); // Debug log

        const viewport = this.gridMatrix.getViewportBounds(scrollLeft, scrollTop, viewportWidth, viewportHeight);

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw grid first
        this.gridMatrix.drawGrid(this.ctx, viewport, scrollLeft, scrollTop);

        // Draw column selection with current scroll values
        this.drawSelection(this.ctx, scrollLeft, scrollTop);

        // Also draw other selections if they exist
        if (this.cellSelector) {
            this.cellSelector.drawSelection(this.ctx, scrollLeft, scrollTop);
        }
    }

    /**
     * Gets the mouse position relative to the canvas.
     * @param e MouseEvent to get the mouse position from
     * @param canvas The canvas element being used
     * @returns The mouse position relative to the canvas
     */
    getMousePosition(e: MouseEvent, canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        return {
            x: e.clientX - rect.left + container.scrollLeft,
            y: e.clientY - rect.top
        };
    }
}