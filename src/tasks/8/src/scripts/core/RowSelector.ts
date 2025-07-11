import { Row } from "../helpers/autoscroll/Row.js";
import { CellSelector } from "./CellSelector.js";
import { GridCell } from "./GridCell.js";
import { GridMatrix } from "./GridMatrix.js";


/**
 * RowSelector class manages row selection in a grid.
 * It allows users to select rows by clicking on row headers, supports drag selection,
 */
export class RowSelector {

    /** Canvas context for rendering */
    ctx: CanvasRenderingContext2D;
    /** Reference to the grid matrix for cell data */
    gridMatrix: GridMatrix;
    /** Currently selected row index */
    selectedRow = -1;
    /** Array of selected row indices */
    selectedRows: number[] = [];
    /** Cell selector instance for managing cell selection and editing */
    cellSelector: CellSelector;
    /** Colors for selection and row header */
    selectionColor = "#0f9d58";
    /** Border color for selection */
    selectionBorderColor = "#137e43";
    /** Background color for row headers */
    rowHeaderBg = "#107c41";
    /** Text color for row headers */
    rowHeaderText = "#fff";
    /** HTML canvas element for rendering */
    canvas: HTMLCanvasElement | null = null;

    rowAutoScroll?: Row;
    /** Drag state */
    dragStartRow: number | null = null;
    /** Whether the user is currently dragging */
    isDragging: boolean = false;

    /** Combination selection state */
    pointerDownRow: number | null = null;
    /** Whether a drag operation has started */
    dragStarted: boolean = false;
    /** Initial selected rows before drag operation */
    initialSelectedRows: number[] = [];





    /**
     * Creates an instance of RowSelector.
     * @param ctx CanvasRenderingContext2D for drawing
     * @param gridMatrix GridMatrix instance for managing grid data
     * @param cellSelector CellSelector instance for managing cell selection
     */
    constructor(ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix, cellSelector: CellSelector) {
        this.ctx = ctx;
        this.cellSelector = cellSelector;
        this.gridMatrix = gridMatrix;
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    setRowAutoScroll(r: Row) {
        this.rowAutoScroll = r;
    }



    /**
     * Checks if the pointer is over a row header.
     * @param e PointerEvent to check if the pointer is over a row header
     * @returns True if the pointer is over a row header, false otherwise
     */
    isRowHeader(e: MouseEvent | PointerEvent): boolean {
        if (!this.canvas) return false;
        const rect = this.canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top + container.scrollTop;

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


    // --- END AUTOSCROLL LOGIC ---
    /**
     * Gets the row index from a mouse event.
     * @param e MouseEvent or PointerEvent to get the row index from
     * @returns The row index or -1 if not found
     */
    getRowFromMouseEvent(e: MouseEvent | PointerEvent): number {
        if (!this.canvas) return -1;
        const rect = this.canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const y = e.clientY - rect.top + container.scrollTop;
        let totalY = 0;
        for (let row = 0; row < this.gridMatrix.rowHeights.length; row++) {
            totalY += this.gridMatrix.rowHeights[row];
            if (y < totalY) {
                return row;
            }
        }
        return -1;
    }

    /** Select a row by index and redraw */
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



    /**
     * Draws the selection rectangle for the column header input.
     * @param row The row index of the header
     * @param col The column index of the header
     * @param scrollLeft The current horizontal scroll position
     * @param scrollTop The current vertical scroll position
     */
    drawSelectionForRowHeaderInput(row: number, col: number, scrollLeft: number, scrollTop: number) {
        const { x, y, width, height } = GridCell.getCellRect(row, col, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);
        const drawX = x - scrollLeft;
        const drawY = y - scrollTop;

        const padding = 3; // Adjust for more/less padding

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255,255,255,0.125)';
        // Optional: shrink fill rect too, or keep full area
        this.ctx.fillRect(drawX, drawY, width, height);

        // Draw inside border with padding, 1px sharp
        this.ctx.strokeStyle = this.selectionBorderColor;
        this.ctx.lineWidth = 1;
        // +0.5 for pixel-perfect, +padding for inset
        this.ctx.strokeRect(
            drawX + padding + 0.5,
            drawY + padding + 0.5,
            width - 2 * padding - 1,
            height - 2 * padding - 1
        );

        this.ctx.restore();
    }

    /**
     * Draws the selection for the currently selected rows.
     * - For contiguous drag selection: draws only the top border on the first row and the bottom border on the last row.
     * - For ctrl+pointerdown (multi-selection with gaps): does not draw top/bottom borders, just fill.
     */
    drawSelection(ctx: CanvasRenderingContext2D, scrollLeft = 0, scrollTop = 0) {
        if (!this.selectedRows || this.selectedRows.length === 0) return;

        const container = document.getElementById('excel-container') as HTMLDivElement;
        const currentScrollLeft = scrollLeft || container.scrollLeft;
        const currentScrollTop = scrollTop || container.scrollTop;

        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;
        const viewport = this.gridMatrix.getViewportBounds(currentScrollLeft, currentScrollTop, viewportWidth, viewportHeight);

        const sortedRows = [...this.selectedRows].sort((a, b) => a - b);
        const isContiguous = this.areRowsContiguous(sortedRows);

        for (let idx = 0; idx < sortedRows.length; idx++) {
            const selectedRow = sortedRows[idx];
            const headerRect = GridCell.getCellRect(selectedRow, 0, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);

            // Skip drawing if row is completely out of view
            const rowTop = headerRect.y - currentScrollTop;
            const rowBottom = rowTop + headerRect.height;
            if (rowBottom < 0 || rowTop > viewportHeight) continue;

            // 1. Draw row header cell (sticky left)
            this.drawRowHeaderCell(ctx, selectedRow, headerRect, currentScrollTop);

            // 2. Draw contiguous borders for row header
            this.drawContiguousRowBorder(ctx, headerRect, currentScrollTop, isContiguous, idx, sortedRows.length);

            // 3. Draw body selection for this row
            this.drawBodySelectionCells(
                ctx, selectedRow, idx, sortedRows, isContiguous, viewport, currentScrollLeft, currentScrollTop
            );

            // 4. Draw sticky column headers for visible columns
            this.drawColumnHeaderCells(ctx, viewport, currentScrollLeft);
        }

        // 5. Redraw corner cell to keep it on top
        this.drawCornerCell(ctx);
    }

    areRowsContiguous(rows: number[]): boolean {
        for (let i = 1; i < rows.length; i++) {
            if (rows[i] !== rows[i - 1] + 1) return false;
        }
        return true;
    }

    drawRowHeaderCell(ctx: CanvasRenderingContext2D, row: number, rect: any, scrollTop: number) {
        const headerCell = this.gridMatrix.getCell(row, 0);
        ctx.save();
        ctx.fillStyle = this.rowHeaderBg;
        ctx.fillRect(0, rect.y - scrollTop, rect.width, rect.height);

        ctx.font = "bold 14px Arial";
        ctx.fillStyle = this.rowHeaderText;
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillText(
            headerCell.data || "",
            rect.width - 8,
            rect.y - scrollTop + rect.height - 4
        );
        ctx.restore();
    }

    drawContiguousRowBorder(ctx: CanvasRenderingContext2D, rect: any, scrollTop: number, isContiguous: boolean, idx: number, totalRows: number) {
        if (!isContiguous) return;
        ctx.save();
        ctx.strokeStyle = this.selectionBorderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Top
        if (idx === 0) {
            ctx.moveTo(0, rect.y - scrollTop);
            ctx.lineTo(rect.width, rect.y - scrollTop);
        }
        // Bottom
        if (idx === totalRows - 1) {
            ctx.moveTo(0, rect.y - scrollTop + rect.height);
            ctx.lineTo(rect.width, rect.y - scrollTop + rect.height);
        }
        ctx.stroke();
        ctx.restore();
    }

    drawBodySelectionCells(
        ctx: CanvasRenderingContext2D, selectedRow: number, idx: number, sortedRows: number[], isContiguous: boolean,
        viewport: any, scrollLeft: number, scrollTop: number
    ) {
        for (let col = Math.max(1, viewport.startCol); col < viewport.endCol; col++) {
            const rect = GridCell.getCellRect(selectedRow, col, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);

            ctx.save();
            ctx.fillStyle = this.selectionColor + "20";
            ctx.fillRect(rect.x - scrollLeft, rect.y - scrollTop, rect.width, rect.height);

            // Special preview highlight logic
            if ((selectedRow === sortedRows[sortedRows.length - 1]) && col === 1 && sortedRows.length > 1 && !isContiguous) {
                const container = document.getElementById('excel-container') as HTMLDivElement;
                this.drawSelectionForRowHeaderInput(selectedRow, col, container.scrollLeft, container.scrollTop);
            } else if (!(sortedRows.length === 1 && col === 1) && !(col === 1 && isContiguous && selectedRow === sortedRows[0])) {
                ctx.fillRect(rect.x - scrollLeft, rect.y - scrollTop, rect.width, rect.height);
            }

            // Draw contiguous top/bottom border
            if (isContiguous) {
                const x = rect.x - scrollLeft;
                const y = rect.y - scrollTop;
                const w = rect.width;
                const h = rect.height;

                ctx.strokeStyle = this.selectionBorderColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                if (idx === 0) {
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + w, y);
                }
                if (idx === sortedRows.length - 1) {
                    ctx.moveTo(x, y + h);
                    ctx.lineTo(x + w, y + h);
                }
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    drawColumnHeaderCells(ctx: CanvasRenderingContext2D, viewport: any, scrollLeft: number) {
        for (let col = Math.max(1, viewport.startCol); col < viewport.endCol; col++) {
            const colHeaderRect = GridCell.getCellRect(0, col, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);
            const colHeaderCell = this.gridMatrix.getCell(0, col);

            ctx.save();
            ctx.fillStyle = "#caead8";
            ctx.fillRect(colHeaderRect.x - scrollLeft, 0, colHeaderRect.width, colHeaderRect.height);

            ctx.font = "bold 14px Arial";
            ctx.fillStyle = "#107c41";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                colHeaderCell.data || "",
                colHeaderRect.x - scrollLeft + colHeaderRect.width / 2,
                colHeaderRect.height / 2
            );

            // Thick green bottom border for column headers
            ctx.strokeStyle = this.selectionBorderColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(colHeaderRect.x - scrollLeft, colHeaderRect.height - 1);
            ctx.lineTo(colHeaderRect.x - scrollLeft + colHeaderRect.width, colHeaderRect.height - 1);
            ctx.stroke();
            ctx.restore();
        }
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

    /** Redraws the entire grid with row selection highlight */
    redrawGrid() {
        if (this.canvas?.style.cursor === 'ns-resize') return;

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

    getMousePosition(e: MouseEvent, canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top + container.scrollTop
        };
    }


    /**
   * Handles keydown events for editing cells.
   * @param e KeyboardEvent to handle keydown events for editing cells
   * @returns 
   */
    handleKeydown(e: KeyboardEvent) {
        if (!this.cellSelector || this.cellSelector.isEditing) return;
        if (this.cellSelector.selectedRow > 0 && this.cellSelector.selectedCol > 0) return;
        if (!this.selectedRows.length) return;

        // Only respond to typing (not ctrl/alt/meta or function keys)
        if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey || e.altKey) return;

        let editrow = -1;

        console.log(this.dragStartRow)
        if (this.dragStartRow !== null) {
            // Drag selection: edit the cell in the column where drag started
            editrow = this.dragStartRow
        } else if (this.selectedRows.length > 1) {
            // Ctrl+click selection: edit the cell in the last selected column
            editrow = this.selectedRows[this.selectedRows.length - 1];
        } else {
            // Single column: edit that column
            editrow = this.selectedRow;
        }

        if (editrow > 0) {
            this.cellSelector.selectCell(1, editrow);
            this.cellSelector.startEditing(e.key);
            e.preventDefault();
        }
    }
}