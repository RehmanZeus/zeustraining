import { CellSelector } from "./CellSelector.js";
import { ColumnSelector } from "./ColumnSelector.js";
import { RowSelector } from "./RowSelector.js";
import { GridResizer } from "./GridResizer.js";
import { GridMatrix } from "./GridMatrix.js";

/**
 * The EventManager class handles user interactions with the grid.
 * It manages pointer events for cell selection, column and row resizing, and keyboard events for editing.
 * It coordinates between the CellSelector, ColumnSelector, RowSelector, and GridResizer to ensure smooth interactions.
 * 
 * This refactored version eliminates the "mode" property and delegates pointer events to the currently active handler.
 */
export class EventManager {
    canvas: HTMLCanvasElement;
    cellSelector: CellSelector;
    columnSelector: ColumnSelector;
    rowSelector: RowSelector;
    gridResizer: GridResizer;
    gridMatrix: GridMatrix;

    // Pointer handler object, set on pointerdown, cleared on pointerup
    private activePointerHandler: {
        onPointerDown?: (e: PointerEvent) => void;
        onPointerMove?: (e: PointerEvent) => void;
        onPointerUp?: (e: PointerEvent) => void;
    } | null = null;

    suppressNextClick = false;

    constructor(
        canvas: HTMLCanvasElement,
        cellSelector: CellSelector,
        columnSelector: ColumnSelector,
        rowSelector: RowSelector,
        gridResizer: GridResizer,
        gridMatrix: GridMatrix
    ) {
        this.canvas = canvas;
        this.cellSelector = cellSelector;
        this.columnSelector = columnSelector;
        this.rowSelector = rowSelector;
        this.gridResizer = gridResizer;
        this.gridMatrix = gridMatrix;
        this.attachEvents();
    }

    getStartColumnIndex() {
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;
        const { startCol } = this.gridMatrix.getViewportBounds(scrollLeft, scrollTop, viewportWidth, viewportHeight);
        return startCol;
    }

    attachEvents() {
        window.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        window.addEventListener('pointermove', this.handlePointerMove.bind(this));
        window.addEventListener('pointerup', this.handlePointerUp.bind(this));
        window.addEventListener('click', this.handleClick.bind(this));
        window.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    handlePointerDown(e: PointerEvent) {
        // Reset any old handler on fresh pointerdown
        this.activePointerHandler = null;
        // Assign the correct handler and delegate
        if (this.gridResizer.isNearColumnEdge(e) || this.gridResizer.isNearRowEdge(e)) {
            this.activePointerHandler = this.gridResizer;
        } else if (this.cellSelector.isCell(e)) {
            this.activePointerHandler = this.cellSelector;
        } else if (this.columnSelector.isColumnHeader(e)) {
            this.activePointerHandler = this.columnSelector;
        } else if (this.rowSelector.isRowHeader(e)) {
            this.activePointerHandler = this.rowSelector;
        }
        this.activePointerHandler?.onPointerDown?.(e);
    }

    handlePointerMove(e: PointerEvent) {
        // Let the active handler manage move if present
        if (this.activePointerHandler?.onPointerMove) {
            this.activePointerHandler.onPointerMove(e);
            return;
        }
        // Otherwise, update cursor for resize
        if (this.gridResizer.isNearColumnEdge(e)) {
            this.canvas.style.cursor = "ew-resize";
        } else if (this.gridResizer.isNearRowEdge(e)) {
            this.canvas.style.cursor = "ns-resize";
        } else {
            this.canvas.style.cursor = "cell";
        }
    }

    handlePointerUp(e: PointerEvent) {
        // Let the active handler manage up if present
        if (this.activePointerHandler?.onPointerUp) {
            this.activePointerHandler.onPointerUp(e);
        }
        // Special case: suppress click after resizing
        if (this.activePointerHandler === this.gridResizer &&
            (this.gridResizer.isResizingCol || this.gridResizer.isResizingRow)
        ) {
            this.suppressNextClick = true;
        }
        this.activePointerHandler = null;
        // Always reset cursor
        this.canvas.style.cursor = "cell";
    }

    handleClick(e: MouseEvent) {
        // Suppress click if requested (e.g. after resizing)
        if (this.suppressNextClick) {
            this.suppressNextClick = false;
            return;
        }
        // Column header
        if (typeof this.columnSelector.isColumnHeader === "function" && this.columnSelector.isColumnHeader(e)) {
            this.rowSelector.clearSelection();
            this.cellSelector.clearEditing();
            return;
        }
        // Row header
        if (typeof this.rowSelector.isRowHeader === "function" && this.rowSelector.isRowHeader(e)) {
            this.columnSelector.clearSelection();
            this.cellSelector.clearEditing();
            return;
        }
        // Data cell
        if (this.cellSelector.isCell(e)) {
            this.columnSelector.clearSelection();
            this.rowSelector.clearSelection();
            this.cellSelector.onClick(e);
        }
    }

    handleDoubleClick(e: MouseEvent) {
        if (this.cellSelector.isCell(e)) {
            this.cellSelector.onDoubleClick(e);
        }
    }

    handleKeydown(e: KeyboardEvent) {
        if (typeof this.cellSelector.handleKeydown === "function") {
            this.cellSelector.handleKeydown(e);
        }
    }
}