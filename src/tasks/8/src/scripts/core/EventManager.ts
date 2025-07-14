import { GridMatrix } from "./GridMatrix.js";
import { RowResizeStrategy } from "./strategies/RowResizeStrategy.js";
import { RowResizer } from "./RowResizer.js";
import { ColumnResizer } from "./ColumnResizer.js";
import { ColumnResizeStrategy } from "./strategies/ColumnResizeStrategy.js";
import { ColumnSelectorStrategy } from "./strategies/ColumnSelectorStrategy.js";
import { ColumnSelector } from "./ColumnSelector.js";
import { CellSelector } from "./CellSelector.js";
import { RowSelector } from "./RowSelector.js";
import { RowSelectorStrategy } from "./strategies/RowSelectorStrategy.js";
import { CellSelectionStrategy } from "./strategies/CellSelectionStrategy.js";

/**
 * Type definition for all strategies used in the grid.
 */
type Strategy =
    | RowResizeStrategy
    | ColumnResizeStrategy
    | ColumnSelectorStrategy
    | RowSelectorStrategy
    | CellSelectionStrategy;

    
/**
 * EventManager class to handle user interactions with the grid.
 * It manages pointer events, strategies for resizing and selecting cells,
 */
export class EventManager {

    /** Row resizer instance */
    private rowResizer: RowResizer;
    /** Grid matrix containing cell data and dimensions */
    private gridMatrix: GridMatrix;
    /** Column resizer instance */
    private colResizer: ColumnResizer;
    /** Cell selector instance for managing cell selection */
    private cellSelector: CellSelector;
    /** Row selector instance for managing row selection */
    private rowSelector: RowSelector;
    /** Column selector instance for managing column selection */
    private columnSelector: ColumnSelector;
    /** HTML canvas element for rendering the grid */
    private canvas: HTMLCanvasElement;
    /** HTML container element for the grid */
    private container: HTMLDivElement;
    /** Array of strategies for handling different interactions */
    private strategies: Strategy[];
    /** Currently active strategy for pointer events */
    private activeStrategy: Strategy | null = null;

    /**
     * EventManager constructor to initialize instances and strategies.
     * @param rowResizer - Instance of RowResizer
     * @param gridMatrix - Instance of GridMatrix
     * @param colResizer - Instance of ColumnResizer
     * @param cellSelector - Instance of CellSelector
     * @param rowSelector - Instance of RowSelector
     * @param columnSelector - Instance of ColumnSelector
     * @param canvas - HTML canvas element for rendering the grid
     * @param container - HTML container element for the grid
     */
    constructor(
        rowResizer: RowResizer,
        gridMatrix: GridMatrix,
        colResizer: ColumnResizer,
        cellSelector: CellSelector,
        rowSelector: RowSelector,
        columnSelector: ColumnSelector,
        canvas: HTMLCanvasElement,
        container: HTMLDivElement 
    ) {
        this.rowResizer = rowResizer;
        this.gridMatrix = gridMatrix;
        this.colResizer = colResizer;
        this.columnSelector = columnSelector;
        this.cellSelector = cellSelector;
        this.rowSelector = rowSelector;
        this.canvas = canvas;
        this.container = container;
        this.strategies = [
            new RowResizeStrategy(this.rowResizer, this.gridMatrix),
            new ColumnResizeStrategy(this.colResizer, this.gridMatrix),
            new ColumnSelectorStrategy(this.columnSelector, this.cellSelector, this.gridMatrix),
            new RowSelectorStrategy(this.rowSelector, this.cellSelector, this.gridMatrix),
            new CellSelectionStrategy(this.cellSelector)
        ];
        this.attachEvents();
    }

    /**
     * Find the active strategy based on the pointer event.
     * @param e Pointer event to find the strategy that matches the pointer position.
     * @returns The active strategy or null if none is found.
     */
    private findStrategy(e: PointerEvent): Strategy | null {
        return this.strategies.find(strategy => strategy.hitTest(e)) ?? null;
    }

    /**
     * Set the cursor style for the canvas.
     * If no cursor is provided, it defaults to "default".
     * @param cursor - The cursor style to set.
     */
    private setCursor(cursor: string = "default") {
        this.canvas.style.cursor = cursor;
    }

    /**
     * Attach event listeners for pointer and keyboard events.
     */
    private attachEvents() {
        window.addEventListener("pointerdown", this.handlePointerDown);
        window.addEventListener("pointermove", this.handlePointerMove);
        window.addEventListener("pointerup", this.handlePointerUp);
        this.container.addEventListener("dblclick", this.handleDoubleClick);
        document.addEventListener("keydown", this.handleKeydown);
    }

    /**
     * Find the active strategy based on the pointer event.
     * @param e Pointer event to handle pointer down events.
     * Sets the active strategy based on the pointer position and starts the interaction.
     */
    private handlePointerDown = (e: PointerEvent) => {
        this.activeStrategy = this.findStrategy(e);
        if (this.activeStrategy) {
            this.activeStrategy.onPointerDown(e);
            this.setCursor(this.activeStrategy.getCursor());
        }
    };

    /**
     * Find the active strategy based on the pointer event.
     * @param e Pointer event to handle pointer move events.
     * If an active strategy exists, it calls the onPointerMove method of that strategy.
     */
    private handlePointerMove = (e: PointerEvent) => {
        if (this.activeStrategy) {
            this.activeStrategy.onPointerMove(e);
            this.setCursor(this.activeStrategy.getCursor());
        } else {
            const hovered = this.findStrategy(e);
            this.setCursor(hovered ? hovered.getCursor() : "default");
        }
    };

    /**
     * Find the active strategy based on the pointer event.
     * @param e Pointer event to handle pointer up events.
     * If an active strategy exists, it calls the onPointerUp method of that strategy,
     */
    private handlePointerUp = (e: PointerEvent) => {
        if (this.activeStrategy) {
            this.activeStrategy.onPointerUp(e);
            const hovered = this.findStrategy(e);
            this.setCursor(hovered ? hovered.getCursor() : "default");
            this.activeStrategy = null;
        }
    };

    /**
     * Find the active strategy based on the pointer event.
     * @param e MouseEvent to handle double-click events.
     * If the cellSelector is active, it calls its onDoubleClick method.
     */
    private handleDoubleClick = (e: MouseEvent) => {
        if (this.cellSelector.isCell(e)) {
            this.cellSelector.onDoubleClick(e);
        }
    };

    /**
     * Find the active strategy based on the pointer event.
     * @param e KeyboardEvent to handle keydown events.
     * It delegates the keydown handling to both cellSelector and columnSelector.
     */
    private handleKeydown = (e: KeyboardEvent) => {
        this.cellSelector.handleKeydown?.(e);
        this.columnSelector.handleKeydown?.(e);
    };
}