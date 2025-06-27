import { DPR, MIN_GRIDCELL_HEIGHT, MIN_GRIDCELL_WIDTH } from "../constants.js";
import { CellSelector } from "./CellSelector.js";
import { GridMatrix } from "./GridMatrix.js";
import { GridCell } from "./GridCell.js";

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

    /**
     * Returns true if pointer is near a column edge in the column header area (row 0)
     * Uses canvas-relative pointer position for hit-testing (ignores scroll offset)
     */
    isNearColumnEdge(e: PointerEvent): boolean {
        const { x, y } = this.getMousePositionForEdgeDetection(e);
        const headerHeight = this.gridMatrix.rowHeights[0];
        if (y > headerHeight) {
            this.resizingColIndex = -1;
            return false;
        }
        // Use GridCell.getCellRect for edge detection
        for (let i = 0; i < this.gridMatrix.columnWidths.length; i++) {
            const rect = GridCell.getCellRect(0, i, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);
            if (Math.abs(x - (rect.x + rect.width)) < this.resizeThreshold) {
                this.resizingColIndex = i;
                return true;
            }
        }
        this.resizingColIndex = -1;
        return false;
    }

    /**
     * Returns true if pointer is near a row edge in the row header area (col 0)
     * Uses canvas-relative pointer position for hit-testing (ignores scroll offset)
     */
    isNearRowEdge(e: PointerEvent): boolean {
        const { x, y } = this.getMousePositionForEdgeDetection(e);
        const headerWidth = this.gridMatrix.columnWidths[0];
        if (x > headerWidth) {
            this.resizingRowIndex = -1;
            return false;
        }
        // Use GridCell.getCellRect for edge detection
        for (let i = 0; i < this.gridMatrix.rowHeights.length; i++) {
            const rect = GridCell.getCellRect(i, 0, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);
            if (Math.abs(y - (rect.y + rect.height)) < this.resizeThreshold) {
                this.resizingRowIndex = i;
                return true;
            }
        }
        this.resizingRowIndex = -1;
        return false;
    }

    onPointerDown(e: PointerEvent) {
        // For edge detection: use canvas-relative position (not scrolled!)
        const { x, y } = this.getMousePositionForEdgeDetection(e);
        if (this.isNearColumnEdge(e) && this.resizingColIndex > 0) {
            this.isResizingCol = true;
            this.startX = x;
            this.initialWidth = this.gridMatrix.columnWidths[this.resizingColIndex];
            this.canvas.style.cursor = "ew-resize";
            e.preventDefault();
        } else if (this.isNearRowEdge(e) && this.resizingRowIndex > 0) {
            this.isResizingRow = true;
            this.startY = y;
            this.initialHeight = this.gridMatrix.rowHeights[this.resizingRowIndex];
            this.canvas.style.cursor = "ns-resize";
            e.preventDefault();
        }
    }

    onPointerMove(e: PointerEvent) {
        if (this.isResizingCol || this.isResizingRow) {
            this.handleResize(e);
            return;
        }
        if (this.isNearColumnEdge(e) && this.resizingColIndex > 0) {
            this.canvas.style.cursor = "ew-resize";
        } else if (this.isNearRowEdge(e) && this.resizingRowIndex > 0) {
            this.canvas.style.cursor = "ns-resize";
        } else {
            this.canvas.style.cursor = "cell";
        }
    }

    onPointerUp(e: PointerEvent) {
        this.isResizingCol = false;
        this.isResizingRow = false;
        this.resizingColIndex = -1;
        this.resizingRowIndex = -1;
        this.canvas.style.cursor = "cell";
    }

    // No need to update cell positions, always use GridCell.getCellRect when needed

    handleResize(e: PointerEvent) {
        // For resizing, use canvas-relative pointer position (not scrolled!)
        const { x, y } = this.getMousePositionForEdgeDetection(e);
        let changed = false;

        if (this.isResizingCol && this.resizingColIndex >= 0) {
            const delta = x - this.startX;
            const newWidth = Math.max(MIN_GRIDCELL_WIDTH, this.initialWidth + delta);
            if (this.gridMatrix.columnWidths[this.resizingColIndex] !== newWidth) {
                this.gridMatrix.columnWidths[this.resizingColIndex] = newWidth;
                changed = true;
            }
        }
        if (this.isResizingRow && this.resizingRowIndex >= 0) {
            const delta = y - this.startY;
            const newHeight = Math.max(MIN_GRIDCELL_HEIGHT, this.initialHeight + delta);
            if (this.gridMatrix.rowHeights[this.resizingRowIndex] !== newHeight) {
                this.gridMatrix.rowHeights[this.resizingRowIndex] = newHeight;
                changed = true;
            }
        }
        if (changed) {
            const container = this.canvas.parentElement!;
            this.redrawGrid();
        }
    }

    /**
     * Returns the pointer position relative to the canvas's visible area (not scrolled content).
     * This is used for edge detection and resize dragging, so that scroll works correctly.
     */
    getMousePositionForEdgeDetection(e: PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();
        // DO NOT add scroll offset here for edge detection!
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    /**
     * Returns the pointer position relative to the grid content (including scroll).
     * Use this ONLY if you actually need the scrolled content coordinates.
     * (For most resizer logic, you want getMousePositionForEdgeDetection instead!)
     */
    getMousePosition(e: PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const container = this.canvas.parentElement!;
        return {
            x: e.clientX - rect.left + container.scrollLeft,
            y: e.clientY - rect.top + container.scrollTop
        };
    }
}