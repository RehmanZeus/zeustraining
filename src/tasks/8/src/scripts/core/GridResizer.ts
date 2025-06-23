import { DPR, MIN_GRIDCELL_HEIGHT, MIN_GRIDCELL_WIDTH } from "../constants.js";
import { CellSelector } from "./CellSelector.js";
import { GridMatrix } from "./GridMatrix.js";

/**
 * GridResizer handles interactive resizing of grid columns and rows
 * via pointer events on the canvas. It updates the grid layout dynamically
 * and ensures accurate rendering and interaction after each resize.
 */
export class GridResizer {
    /** Canvas element where the grid is rendered */
    canvas: HTMLCanvasElement;

    /** Canvas 2D rendering context */
    ctx: CanvasRenderingContext2D;

    /** Reference to the GridMatrix instance being manipulated */
    gridMatrix: GridMatrix;

    /** Reference to CellSelector for proper redrawing */
    cellSelector?: CellSelector;

    /** Flags and indices for tracking active resize operations */
    isResizingCol = false;
    isResizingRow = false;
    resizingColIndex = -1;
    resizingRowIndex = -1;

    /** Starting pointer coordinates for resize calculations */
    startX = 0;
    startY = 0;

    /** Initial width/height when starting resize */
    initialWidth = 0;
    initialHeight = 0;

    /** Pixel threshold to detect proximity to column/row edges */
    resizeThreshold = 5;

    /**
     * Constructs a GridResizer instance and attaches pointer event listeners.
     * 
     * @param canvas - HTML canvas element
     * @param ctx - Canvas 2D rendering context
     * @param gridMatrix - GridMatrix instance to be resized
     */
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;

        this.attachEvents();
    }

    /**
     * Sets the CellSelector reference for proper redrawing
     */
    setCellSelector(cellSelector: CellSelector) {
        this.cellSelector = cellSelector;
    }

    /**
     * Attaches pointer event listeners for resizing interactions.
     */
    attachEvents() {
        this.canvas.addEventListener("pointermove", this.handleMouseMove.bind(this));
        this.canvas.addEventListener("pointerdown", this.handleMouseDown.bind(this));
        this.canvas.addEventListener("pointerup", this.handleMouseUp.bind(this));
    }

    /**
     * Handles pointer movement to detect proximity to column or row edges
     * and updates the cursor style accordingly.
     */
    handleMouseMove(e: PointerEvent) {
        if (this.isResizingCol || this.isResizingRow) {
            this.handleResize(e);
            return;
        }

        const { x, y } = this.getMousePosition(e);
        const { nearColEdge, colIndex } = this.isNearColumnEdge(x);
        const { nearRowEdge, rowIndex } = this.isNearRowEdge(y);

        if (nearColEdge && colIndex > 0) {
            this.canvas.style.cursor = "col-resize";
        } else if (nearRowEdge && rowIndex > 0) {
            this.canvas.style.cursor = "row-resize";
        } else {
            this.canvas.style.cursor = "default";
        }
    }

    /**
     * Handles pointer down event to initiate column or row resizing.
     */
    handleMouseDown(e: PointerEvent) {
        const { x, y } = this.getMousePosition(e);
        const { nearColEdge, colIndex } = this.isNearColumnEdge(x);
        const { nearRowEdge, rowIndex } = this.isNearRowEdge(y);

        if (nearColEdge && colIndex > 0) {
            this.isResizingCol = true;
            this.resizingColIndex = colIndex;
            this.startX = x;
            this.initialWidth = this.gridMatrix.columnWidths[colIndex];
            this.canvas.style.cursor = "col-resize";
            e.preventDefault();
        } else if (nearRowEdge && rowIndex > 0) {
            this.isResizingRow = true;
            this.resizingRowIndex = rowIndex;
            this.startY = y;
            this.initialHeight = this.gridMatrix.rowHeights[rowIndex];
            this.canvas.style.cursor = "row-resize";
            e.preventDefault();
        }
    }

    /**
     * Handles pointer up event to finalize resizing.
     */
    handleMouseUp(e: PointerEvent) {
        this.isResizingCol = false;
        this.isResizingRow = false;
        this.resizingColIndex = -1;
        this.resizingRowIndex = -1;
        this.canvas.style.cursor = "default";
    }

    /**
     * Dynamically updates column widths or row heights based on pointer movement
     * and recalculates cell positions and dimensions.
     */
    handleResize(e: PointerEvent) {
        const { x, y } = this.getMousePosition(e);

        if (this.isResizingCol && this.resizingColIndex >= 0) {
            const delta = x - this.startX;
            const newWidth = Math.max(MIN_GRIDCELL_WIDTH, this.initialWidth + delta);
            
            this.gridMatrix.columnWidths[this.resizingColIndex] = newWidth;
            this.updateGridLayout();
            this.redrawGrid();
        }

        if (this.isResizingRow && this.resizingRowIndex >= 0) {
            const delta = y - this.startY;
            const newHeight = Math.max(MIN_GRIDCELL_HEIGHT, this.initialHeight + delta);
            
            this.gridMatrix.rowHeights[this.resizingRowIndex] = newHeight;
            this.updateGridLayout();
            this.redrawGrid();
        }
    }

    /**
     * Updates the grid layout after resizing by recalculating all cell positions and dimensions
     */
    updateGridLayout() {
        for (let row = 0; row < this.gridMatrix.noOfRows; row++) {
            let y = this.gridMatrix.rowHeights.slice(0, row).reduce((a, b) => a + b, 0);
            const rowCells = this.gridMatrix.grid[row];

            for (let col = 0; col < this.gridMatrix.noOfCols; col++) {
                let x = this.gridMatrix.columnWidths.slice(0, col).reduce((a, b) => a + b, 0);
                const cell = rowCells[col];

                cell.x = x;
                cell.y = y;
                cell.width = this.gridMatrix.columnWidths[col];
                cell.height = this.gridMatrix.rowHeights[row];
            }
        }
    }

    /**
     * Redraws the entire grid
     */
    redrawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width / DPR, this.canvas.height / DPR);
        this.gridMatrix.drawGrid(this.ctx);
        
        // Redraw selection if CellSelector is available
        if (this.cellSelector) {
            this.cellSelector.drawSelection(this.ctx);
        }
    }

    /**
     * Checks if the mouse is near a column edge and returns the edge information
     */
    isNearColumnEdge(x: number): { nearColEdge: boolean, colIndex: number } {
        let total = 0;
        for (let i = 0; i < this.gridMatrix.columnWidths.length; i++) {
            total += this.gridMatrix.columnWidths[i];
            if (Math.abs(x - total) < this.resizeThreshold) {
                return { nearColEdge: true, colIndex: i };
            }
        }
        return { nearColEdge: false, colIndex: -1 };
    }

    /**
     * Checks if the mouse is near a row edge and returns the edge information
     */
    isNearRowEdge(y: number): { nearRowEdge: boolean, rowIndex: number } {
        let total = 0;
        for (let i = 0; i < this.gridMatrix.rowHeights.length; i++) {
            total += this.gridMatrix.rowHeights[i];
            if (Math.abs(y - total) < this.resizeThreshold) {
                return { nearRowEdge: true, rowIndex: i };
            }
        }
        return { nearRowEdge: false, rowIndex: -1 };
    }

    /**
     * Converts pointer event coordinates to canvas-relative coordinates.
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
