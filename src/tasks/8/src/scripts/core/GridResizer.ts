import { DPR, MIN_GRIDCELL_HEIGHT, MIN_GRIDCELL_WIDTH } from "../constants.js";
import { CellSelector } from "./CellSelector.js";
import { GridMatrix } from "./GridMatrix.js";

export class GridResizer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    gridMatrix: GridMatrix;
    cellSelector?: CellSelector;

    isResizingCol = false;
    isResizingRow = false;
    resizingColIndex = -1;
    resizingRowIndex = -1;

    startX = 0;
    startY = 0;
    initialWidth = 0;
    initialHeight = 0;

    resizeThreshold = 5;
    redrawGrid: () => void = () => { };

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;
    }

    setCellSelector(cellSelector: CellSelector) {
        this.cellSelector = cellSelector;
    }

    setRedrawGridCallback(redrawFn: () => void) {
        this.redrawGrid = redrawFn;
    }

    /** Returns true if pointer is near a column edge in the column header area (row 0) */
    isNearColumnEdge(e: PointerEvent): boolean {
        const { x, y } = this.getMousePosition(e);
        // Only allow resizing if pointer is within the header row (y range of row 0)
        const headerHeight = this.gridMatrix.rowHeights[0];
        if (y > headerHeight) {
            this.resizingColIndex = -1;
            return false;
        }
        let total = 0;
        for (let i = 0; i < this.gridMatrix.columnWidths.length; i++) {
            total += this.gridMatrix.columnWidths[i];
            if (Math.abs(x - total) < this.resizeThreshold) {
                this.resizingColIndex = i;
                return true;
            }
        }
        this.resizingColIndex = -1;
        return false;
    }

    /** Returns true if pointer is near a row edge in the row header area (col 0) */
    isNearRowEdge(e: PointerEvent): boolean {
        const { x, y } = this.getMousePosition(e);
        // Only allow resizing if pointer is within the header column (x range of col 0)
        const headerWidth = this.gridMatrix.columnWidths[0];
        if (x > headerWidth) {
            this.resizingRowIndex = -1;
            return false;
        }
        let total = 0;
        for (let i = 0; i < this.gridMatrix.rowHeights.length; i++) {
            total += this.gridMatrix.rowHeights[i];
            if (Math.abs(y - total) < this.resizeThreshold) {
                this.resizingRowIndex = i;
                return true;
            }
        }
        this.resizingRowIndex = -1;
        return false;
    }

    onPointerDown(e: PointerEvent) {
        const { x, y } = this.getMousePosition(e);
        if (this.isNearColumnEdge(e) && this.resizingColIndex > 0) {
            this.isResizingCol = true;
            this.startX = x;
            this.initialWidth = this.gridMatrix.columnWidths[this.resizingColIndex];
            this.canvas.style.cursor = "col-resize";
            e.preventDefault();
        } else if (this.isNearRowEdge(e) && this.resizingRowIndex > 0) {
            this.isResizingRow = true;
            this.startY = y;
            this.initialHeight = this.gridMatrix.rowHeights[this.resizingRowIndex];
            this.canvas.style.cursor = "row-resize";
            e.preventDefault();
        }
    }

    onPointerMove(e: PointerEvent) {
        if (this.isResizingCol || this.isResizingRow) {
            this.handleResize(e);
            return;
        }
        if (this.isNearColumnEdge(e) && this.resizingColIndex > 0) {
            this.canvas.style.cursor = "col-resize";
        } else if (this.isNearRowEdge(e) && this.resizingRowIndex > 0) {
            this.canvas.style.cursor = "row-resize";
        } else {
            this.canvas.style.cursor = "default";
        }
    }

    onPointerUp(e: PointerEvent) {
        this.isResizingCol = false;
        this.isResizingRow = false;
        this.resizingColIndex = -1;
        this.resizingRowIndex = -1;
        this.canvas.style.cursor = "default";
    }

    updateColumnLayout(colIndex: number) {
        let x = this.gridMatrix.columnWidths.slice(0, colIndex).reduce((a, b) => a + b, 0);
        let width = this.gridMatrix.columnWidths[colIndex];
        for (let row = 0; row < this.gridMatrix.noOfRows; row++) {
            let y = this.gridMatrix.rowHeights.slice(0, row).reduce((a, b) => a + b, 0);
            const cell = this.gridMatrix.getCell(row, colIndex);
            cell.x = x;
            cell.y = y;
            cell.width = width;
            cell.height = this.gridMatrix.rowHeights[row];
        }
    }

    updateRowLayout(rowIndex: number) {
        let y = this.gridMatrix.rowHeights.slice(0, rowIndex).reduce((a, b) => a + b, 0);
        let height = this.gridMatrix.rowHeights[rowIndex];
        for (let col = 0; col < this.gridMatrix.noOfCols; col++) {
            let x = this.gridMatrix.columnWidths.slice(0, col).reduce((a, b) => a + b, 0);
            const cell = this.gridMatrix.getCell(rowIndex, col);
            cell.x = x;
            cell.y = y;
            cell.width = this.gridMatrix.columnWidths[col];
            cell.height = height;
        }
    }

    handleResize(e: PointerEvent) {
        const { x, y } = this.getMousePosition(e);
        let changed = false;

        if (this.isResizingCol && this.resizingColIndex >= 0) {
            const delta = x - this.startX;
            const newWidth = Math.max(MIN_GRIDCELL_WIDTH, this.initialWidth + delta);
            if (this.gridMatrix.columnWidths[this.resizingColIndex] !== newWidth) {
                this.gridMatrix.columnWidths[this.resizingColIndex] = newWidth;
                this.updateColumnLayout(this.resizingColIndex);
                changed = true;
            }
        }
        if (this.isResizingRow && this.resizingRowIndex >= 0) {
            const delta = y - this.startY;
            const newHeight = Math.max(MIN_GRIDCELL_HEIGHT, this.initialHeight + delta);
            if (this.gridMatrix.rowHeights[this.resizingRowIndex] !== newHeight) {
                this.gridMatrix.rowHeights[this.resizingRowIndex] = newHeight;
                this.updateRowLayout(this.resizingRowIndex);
                changed = true;
            }
        }
        if (changed) {
            const container = this.canvas.parentElement!;
            this.updateGridLayoutViewport(
                container.scrollLeft,
                container.scrollTop,
                container.clientWidth,
                container.clientHeight
            );
            this.redrawGrid();
        }
    }

    updateGridLayoutViewport(scrollLeft: number, scrollTop: number, viewportWidth: number, viewportHeight: number) {
        const { startRow, endRow, startCol, endCol } = this.gridMatrix.getViewportBounds(
            scrollLeft, scrollTop, viewportWidth, viewportHeight
        );
        const rowStart = Math.max(0, startRow - 1);
        const colStart = Math.max(0, startCol - 1);

        let y = this.gridMatrix.rowHeights.slice(0, rowStart).reduce((a, b) => a + b, 0);
        for (let row = rowStart; row < endRow; row++) {
            let x = this.gridMatrix.columnWidths.slice(0, colStart).reduce((a, b) => a + b, 0);
            for (let col = colStart; col < endCol; col++) {
                const cell = this.gridMatrix.getCell(row, col);
                cell.x = x;
                cell.y = y;
                cell.width = this.gridMatrix.columnWidths[col];
                cell.height = this.gridMatrix.rowHeights[row];
                x += this.gridMatrix.columnWidths[col];
            }
            y += this.gridMatrix.rowHeights[row];
        }
    }

    getMousePosition(e: PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const container = this.canvas.parentElement!;
        return {
            x: e.clientX - rect.left + container.scrollLeft,
            y: e.clientY - rect.top + container.scrollTop
        };
    }
}