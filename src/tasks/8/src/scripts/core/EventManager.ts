import { CellSelector } from "./CellSelector.js";
import { ColumnSelector } from "./ColumnSelector.js";
import { RowSelector } from "./RowSelector.js";
import { GridResizer } from "./GridResizer.js";
import { GridMatrix } from "./GridMatrix.js";

type Mode = "idle" | "dragging" | "resizing" | "editing";

/**
 * The EventManager class handles user interactions with the grid.
 * It manages pointer events for cell selection, column and row resizing, and keyboard events for editing.
 * It coordinates between the CellSelector, ColumnSelector, RowSelector, and GridResizer to ensure smooth interactions.
 */
export class EventManager {
    canvas: HTMLCanvasElement;
    cellSelector: CellSelector;
    columnSelector: ColumnSelector;
    rowSelector: RowSelector;
    gridResizer: GridResizer;
    mode: Mode = "idle";
    suppressNextClick = false;
    gridMatrix: GridMatrix;

    /**
     * Creates an instance of the EventManager.
     * @param canvas The HTML canvas element where the grid is rendered.
     * @param cellSelector The CellSelector instance for managing cell selection.
     * @param columnSelector The ColumnSelector instance for managing column selection.
     * @param rowSelector The RowSelector instance for managing row selection.
     * @param gridResizer The GridResizer instance for managing grid resizing.
     * @param gridMatrix The GridMatrix instance for managing grid data.
     */
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

    /**
     * Gets the index of the first visible column in the viewport.
     * @returns The index of the first visible column in the viewport.
     * This is determined by the current scroll position and viewport size.
     */

    getStartColumnIndex() {

        const container = document.getElementById('excel-container') as HTMLDivElement;

        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;

        const {startCol} = this.gridMatrix.getViewportBounds(scrollLeft, scrollTop, viewportWidth, viewportHeight);

        return startCol;

    }

    /**
     * Attaches event listeners to the canvas for pointer and keyboard events.
     * This method sets up the necessary event handlers for user interactions with the grid.
     */
    attachEvents() {
        window.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        window.addEventListener('pointermove', this.handlePointerMove.bind(this));
        window.addEventListener('pointerup', this.handlePointerUp.bind(this));
        window.addEventListener('click', this.handleClick.bind(this));
        window.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        window.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    /**
     * Handles pointer down events on the canvas.
     * Determines if the pointer is near a column or row edge for resizing, or if it's over a cell for dragging.
     * @param e The pointer event to handle.
     */
    handlePointerDown(e: PointerEvent) {
        if (this.gridResizer.isNearColumnEdge(e) || this.gridResizer.isNearRowEdge(e)) {
            this.mode = "resizing";
            this.gridResizer.onPointerDown(e);
            return;
        }
        if (this.cellSelector.isCell(e)) {
            this.mode = "dragging";
            this.cellSelector.onPointerDown(e);
            return;
        }
        this.mode = "idle";
    }

    /**
     * Handles pointer move events on the canvas.
     * Changes the cursor style based on whether the pointer is near a column or row edge.
     * If resizing or dragging, delegates to the appropriate handler.
     * @param e The pointer event to handle.
     */
    handlePointerMove(e: PointerEvent) {
        if (this.mode === "resizing") {
            this.gridResizer.onPointerMove(e);
            return;
        }
        if (this.mode === "dragging") {
            this.cellSelector.onPointerMove(e);
            return;
        }
        if (this.gridResizer.isNearColumnEdge(e)) {
            this.canvas.style.cursor = "ew-resize";
        } else if (this.gridResizer.isNearRowEdge(e)) {
            this.canvas.style.cursor = "ns-resize";
        } else {
            this.canvas.style.cursor = "cell";
        }

     
    }



    /**
     * Handles pointer up events on the canvas.
     * Resets the mode to idle after resizing or dragging.
     * @param e The pointer event to handle.
     */
    handlePointerUp(e: PointerEvent) {
        if (this.mode === "resizing") {
            this.gridResizer.onPointerUp(e);
            this.mode = "idle";
            this.suppressNextClick = true; // suppress next click after resizing
            return;
        }
        if (this.mode === "dragging") {
            this.cellSelector.onPointerUp(e);
            this.mode = "idle";
            return;
        }
    }

    /**
     * Handles click events on the canvas.
     * Suppresses the click event if requested (e.g. after resizing).
     * @param e The mouse event to handle.
     */
    handleClick(e: MouseEvent) {
        // Suppress click if requested (e.g. after resizing)
        if (this.suppressNextClick) {
            this.suppressNextClick = false;
            return;
        }
        if (this.mode !== "idle") return;

        // Column header
        if (typeof this.columnSelector.isColumnHeader === "function" && this.columnSelector.isColumnHeader(e)) {
            // Clear other selections
            this.rowSelector.clearSelection();
            this.cellSelector.clearEditing();
            this.columnSelector.onClick(e);
            return;
        }

        // Row header
        if (typeof this.rowSelector.isRowHeader === "function" && this.rowSelector.isRowHeader(e)) {
            this.columnSelector.clearSelection();
            this.cellSelector.clearEditing();
            this.rowSelector.onClick(e);
            return;
        }

        // Data cell
        if (this.cellSelector.isCell(e)) {
            this.columnSelector.clearSelection();
            this.rowSelector.clearSelection();
            this.cellSelector.onClick(e);
        }
    }

    /**
     * Handles double click events on the canvas.
     * @param e The mouse event to handle.
     */
    handleDoubleClick(e: MouseEvent) {
        if (this.mode !== "idle") return;
        if (this.cellSelector.isCell(e)) {
            this.cellSelector.onDoubleClick(e);
        }
    }

    /**
     * Handles keydown events on the canvas.
     * @param e The keyboard event to handle.
     */
    handleKeydown(e: KeyboardEvent) {
        if (typeof this.cellSelector.handleKeydown === "function") {
            this.cellSelector.handleKeydown(e);
        }
    }
}