import { CellSelector } from "./CellSelector.js";
import { ColumnSelector } from "./ColumnSelector.js";
import { RowSelector } from "./RowSelector.js";
import { GridResizer } from "./GridResizer.js";
import { GridMatrix } from "./GridMatrix.js";

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
    gridMatrix: GridMatrix;

    // Pointer handler, set on pointerdown, cleared on pointerup
    private activePointerHandler: {
        onPointerDown?: (e: PointerEvent) => void;
        onPointerMove?: (e: PointerEvent) => void;
        onPointerUp?: (e: PointerEvent) => void;
    } | null = null;

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

    /** Determines which handler should respond based on pointer event location */
    handleHitTest(e: PointerEvent) {
        if (this.gridResizer.isNearColumnEdge(e)) {
            this.canvas.style.cursor = "ew-resize";
            return this.gridResizer;
        } else if (this.gridResizer.isNearRowEdge(e)) {
            this.canvas.style.cursor = "ns-resize";
            return this.gridResizer;
        } else if (this.columnSelector.isColumnHeader(e)) {
            this.canvas.style.cursor = "cell";
            return this.columnSelector;
        } else if (this.rowSelector.isRowHeader(e)) {
            this.canvas.style.cursor = "cell";
            return this.rowSelector;
        } else if (this.cellSelector.isCell(e)) {
            this.canvas.style.cursor = "cell";
            return this.cellSelector;
        }
        this.canvas.style.cursor = "cell";
        return null;
    }

    attachEvents() {
        window.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        window.addEventListener('pointermove', this.handlePointerMove.bind(this));
        window.addEventListener('pointerup', this.handlePointerUp.bind(this));
        window.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    handlePointerDown(e: PointerEvent) {
        // Only set handler on pointerdown!
        this.activePointerHandler = this.handleHitTest(e);
        if (this.activePointerHandler?.onPointerDown) {
            this.activePointerHandler.onPointerDown(e);
        }
    }

    handlePointerMove(e: PointerEvent) {
        // Only update cursor if not dragging/resizing
        if (!this.activePointerHandler) {
            this.handleHitTest(e); // for cursor feedback only
        }
        // Call active handler if any
        if (this.activePointerHandler?.onPointerMove) {
            this.activePointerHandler.onPointerMove(e);
        }
    }

    handlePointerUp(e: PointerEvent) {
        // Only call pointerUp on the handler we started with!
        if (this.activePointerHandler?.onPointerUp) {
            this.activePointerHandler.onPointerUp(e);
        }
        this.activePointerHandler = null;
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
        if (typeof this.columnSelector.handleKeydown === "function") {
            this.columnSelector.handleKeydown(e);
        }
    }
}