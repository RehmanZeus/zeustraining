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

    // Track visible viewport
    private viewportStartCol: number = 0;
    private viewportEndCol: number = 0;
    private viewportStartRow: number = 0;
    private viewportEndRow: number = 0;

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
     * Set the visible viewport bounds. Call this before pointer events (from drawVisibleGrid).
     */

    setViewport(startCol: number, endCol: number, startRow: number, endRow: number) {
        this.viewportStartCol = startCol;
        this.viewportEndCol = endCol;
        this.viewportStartRow = startRow;
        this.viewportEndRow = endRow;
        
    }

    /**
   * Returns true if pointer is near a column edge in the column header area (row 0)
   * Handles virtual scrolling by using viewport bounds and scroll-adjusted positions
   */
    isNearColumnEdge(e: PointerEvent): boolean {
        // 1) Compute mouse X/Y in full “grid space” (ignoring viewport clipping)
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + container.scrollLeft;
        const y = e.clientY - rect.top + container.scrollTop;

        // 2) Bail if we’re below the header
        const headerHeight = this.gridMatrix.rowHeights[0];
        if (y >= headerHeight) {
            this.resizingColIndex = -1;
            return false;
        }

        // 3) Compute total width of columns *before* viewportStartCol
        const hiddenOffset = this.gridMatrix.columnWidths
            .slice(0, this.viewportStartCol)
            .reduce((sum, w) => sum + w, 0);

        // 4) Walk visible cols, checking each right‐edge against x
        let cumX = hiddenOffset;
        for (let col = this.viewportStartCol; col < this.viewportEndCol; col++) {
            const w = this.gridMatrix.columnWidths[col];
            const rightEdge = cumX + w;

            if (Math.abs(x - rightEdge) < this.resizeThreshold) {
                this.resizingColIndex = col;
                return true;
            }

            cumX = rightEdge;
            if (cumX > x + this.resizeThreshold) {
                break;  // no chance further cols matter
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
        // 1) Compute absolute grid-space X/Y
        const rect = this.canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const x = e.clientX - rect.left + container.scrollLeft;
        const y = e.clientY - rect.top + container.scrollTop;

        // 2) Bail if we're to the right of the row-header column
        const headerWidth = this.gridMatrix.columnWidths[0];
        if (x > headerWidth) {
            this.resizingRowIndex = -1;
            return false;
        }

        // 3) Compute total height of rows hidden above viewportStartRow
        const hiddenOffset = this.gridMatrix.rowHeights
            .slice(0, this.viewportStartRow)
            .reduce((sum, h) => sum + h, 0);

        // 4) Walk visible rows, checking each bottom edge against y
        let cumY = hiddenOffset;
        for (let row = this.viewportStartRow; row < this.viewportEndRow; row++) {
            const h = this.gridMatrix.rowHeights[row];
            const bottomEdge = cumY + h;

            if (Math.abs(y - bottomEdge) < this.resizeThreshold) {
                this.resizingRowIndex = row;
                return true;
            }

            cumY = bottomEdge;
            if (cumY > y + this.resizeThreshold) {
                break;
            }
        }

        this.resizingRowIndex = -1;
        return false;
    }

    onPointerDown(e: PointerEvent) {
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

    handleResize(e: PointerEvent) {
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