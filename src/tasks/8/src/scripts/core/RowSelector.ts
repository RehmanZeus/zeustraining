import { CellSelector } from "./CellSelector.js";
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

    // Drag state
    private dragStartRow: number | null = null;
    private isDragging: boolean = false;

    constructor(ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix, cellSelector: CellSelector) {
        this.ctx = ctx;
        this.cellSelector = cellSelector;
        this.gridMatrix = gridMatrix;
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }


    /** Returns true if the mouse event is on a row header cell (excluding col 0, row 0) */
    isRowHeader(e: MouseEvent | PointerEvent): boolean {
        if (!this.canvas) return false;
        const rect = this.canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top + container.scrollTop; // <-- FIXED

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


    /** Handles selection on the row header area (pointerdown only) */
    onPointerDown = (e: PointerEvent) => {
        if (!this.isRowHeader(e)) return;
        // Only left click
        if (e.button !== 0) return;

        const rowIndex = this.getRowFromMouseEvent(e);
        if (rowIndex < 1) return;

        if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd+Click: toggle row selection
            const idx = this.selectedRows.indexOf(rowIndex);
            if (idx === -1) {
                this.selectedRows.push(rowIndex);
                this.selectedRow = rowIndex;
            } else {
                this.selectedRows.splice(idx, 1);
                // Update selectedRow to last or -1
                this.selectedRow = this.selectedRows.length ? this.selectedRows[this.selectedRows.length - 1] : -1;
            }
            this.cellSelector.clearRangeSelection();
            this.cellSelector.selectedRow = -1;
            this.cellSelector.selectedCol = -1;
            this.cellSelector.isEditing = false;
            this.cellSelector.inputElement.style.display = 'none';
            this.redrawGrid();
            // Do NOT begin drag-selection on ctrlKey
            return;
        }

        // Begin drag-selection
        this.isDragging = true;
        this.dragStartRow = rowIndex;
        this.selectedRows = [rowIndex];
        this.selectedRow = rowIndex;
        this.cellSelector.clearRangeSelection();
        this.cellSelector.selectedRow = -1;
        this.cellSelector.selectedCol = -1;
        this.cellSelector.isEditing = false;
        this.cellSelector.inputElement.style.display = 'none';
        this.redrawGrid();

        window.addEventListener("pointermove", this.onPointerMove);
        window.addEventListener("pointerup", this.onPointerUp);
    };

    onPointerMove = (e: PointerEvent) => {
        if (!this.isDragging || this.dragStartRow === null) return;
        const rowIndex = this.getRowFromMouseEvent(e);
        if (rowIndex < 1 || rowIndex === this.selectedRow) return;

        // Drag selection: select contiguous range
        const [start, end] = [this.dragStartRow, rowIndex].sort((a, b) => a - b);
        this.selectedRows = [];
        for (let row = start; row <= end; row++) {
            this.selectedRows.push(row);
        }
        this.selectedRow = rowIndex;
        this.redrawGrid();
    };

    onPointerUp = (_e: PointerEvent) => {
        if (this.isDragging) {
            this.isDragging = false;
            this.dragStartRow = null;
            window.removeEventListener("pointermove", this.onPointerMove);
            window.removeEventListener("pointerup", this.onPointerUp);
        }
    };

    getRowFromMouseEvent(e: MouseEvent | PointerEvent): number {
        if (!this.canvas) return -1;
        const rect = this.canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const y = e.clientY - rect.top + container.scrollTop; // <-- FIXED!
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

        // Sort rows for easier logic
        const sortedRows = [...this.selectedRows].sort((a, b) => a - b);

        // Check if selection is contiguous
        let isContiguous = true;
        for (let i = 1; i < sortedRows.length; i++) {
            if (sortedRows[i] !== sortedRows[i - 1] + 1) {
                isContiguous = false;
                break;
            }
        }

        for (let idx = 0; idx < sortedRows.length; idx++) {
            const selectedRow = sortedRows[idx];
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

            // Row header borders (solid left, top, bottom only)
            ctx.strokeStyle = this.selectionBorderColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            // Top
            if (isContiguous && idx === 0) {
                ctx.moveTo(0, headerRect.y - currentScrollTop);
                ctx.lineTo(headerRect.width, headerRect.y - currentScrollTop);
            }
            // Bottom
            if (isContiguous && idx === sortedRows.length - 1) {
                ctx.moveTo(0, headerRect.y - currentScrollTop + headerRect.height);
                ctx.lineTo(headerRect.width, headerRect.y - currentScrollTop + headerRect.height);
            }
            ctx.stroke();
            ctx.restore();

            // 2. Draw visible data cell highlights (scroll in both directions)
            for (let col = Math.max(1, viewport.startCol); col < viewport.endCol; col++) {
                const rect = GridCell.getCellRect(selectedRow, col, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);

                ctx.save();
                ctx.fillStyle = this.selectionColor + "20";
                ctx.fillRect(rect.x - currentScrollLeft, rect.y - currentScrollTop, rect.width, rect.height);

                // Only draw top and bottom borders for contiguous drag
                if (isContiguous) {
                    const x = rect.x - currentScrollLeft;
                    const y = rect.y - currentScrollTop;
                    const w = rect.width;
                    const h = rect.height;

                    ctx.strokeStyle = this.selectionBorderColor;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    // Top border for first row
                    if (idx === 0) {
                        ctx.moveTo(x, y);
                        ctx.lineTo(x + w, y);
                    }
                    // Bottom border for last row
                    if (idx === sortedRows.length - 1) {
                        ctx.moveTo(x, y + h);
                        ctx.lineTo(x + w, y + h);
                    }
                    ctx.stroke();
                }

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
}