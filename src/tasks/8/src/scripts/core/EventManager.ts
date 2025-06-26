import { CellSelector } from "./CellSelector.js";
import { ColumnSelector } from "./ColumnSelector.js";
import { RowSelector } from "./RowSelector.js";
import { GridResizer } from "./GridResizer.js";

type Mode = "idle" | "dragging" | "resizing" | "editing";

export class EventManager {
    canvas: HTMLCanvasElement;
    cellSelector: CellSelector;
    columnSelector: ColumnSelector;
    rowSelector: RowSelector;
    gridResizer: GridResizer;
    mode: Mode = "idle";
    suppressNextClick = false;

    constructor(
        canvas: HTMLCanvasElement,
        cellSelector: CellSelector,
        columnSelector: ColumnSelector,
        rowSelector: RowSelector,
        gridResizer: GridResizer
    ) {
        this.canvas = canvas;
        this.cellSelector = cellSelector;
        this.columnSelector = columnSelector;
        this.rowSelector = rowSelector;
        this.gridResizer = gridResizer;
        this.attachEvents();
    }

    attachEvents() {
        this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
        this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

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
            this.canvas.style.cursor = "col-resize";
        } else if (this.gridResizer.isNearRowEdge(e)) {
            this.canvas.style.cursor = "row-resize";
        } else {
            this.canvas.style.cursor = "default";
        }
    }

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

    handleDoubleClick(e: MouseEvent) {
        if (this.mode !== "idle") return;
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