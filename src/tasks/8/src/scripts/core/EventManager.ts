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

type Strategy =
    | RowResizeStrategy
    | ColumnResizeStrategy
    | ColumnSelectorStrategy
    | RowSelectorStrategy
    | CellSelectionStrategy;

export class EventManager {
    private rowResizer: RowResizer;
    private gridMatrix: GridMatrix;
    private colResizer: ColumnResizer;
    private cellSelector: CellSelector;
    private rowSelector: RowSelector;
    private columnSelector: ColumnSelector;
    private canvas: HTMLCanvasElement;
    private container: HTMLDivElement;
    private strategies: Strategy[];
    private activeStrategy: Strategy | null = null;

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

    private findStrategy(e: PointerEvent): Strategy | null {
        return this.strategies.find(strategy => strategy.hitTest(e)) ?? null;
    }

    private setCursor(cursor: string = "default") {
        this.canvas.style.cursor = cursor;
    }

    private attachEvents() {
        window.addEventListener("pointerdown", this.handlePointerDown);
        window.addEventListener("pointermove", this.handlePointerMove);
        window.addEventListener("pointerup", this.handlePointerUp);
        this.container.addEventListener("dblclick", this.handleDoubleClick);
        document.addEventListener("keydown", this.handleKeydown);
    }

    private handlePointerDown = (e: PointerEvent) => {
        this.activeStrategy = this.findStrategy(e);
        if (this.activeStrategy) {
            this.activeStrategy.onPointerDown(e);
            this.setCursor(this.activeStrategy.getCursor());
        }
    };

    private handlePointerMove = (e: PointerEvent) => {
        if (this.activeStrategy) {
            this.activeStrategy.onPointerMove(e);
            this.setCursor(this.activeStrategy.getCursor());
        } else {
            const hovered = this.findStrategy(e);
            this.setCursor(hovered ? hovered.getCursor() : "default");
        }
    };

    private handlePointerUp = (e: PointerEvent) => {
        if (this.activeStrategy) {
            this.activeStrategy.onPointerUp(e);
            const hovered = this.findStrategy(e);
            this.setCursor(hovered ? hovered.getCursor() : "default");
            this.activeStrategy = null;
        }
    };

    private handleDoubleClick = (e: MouseEvent) => {
        if (this.cellSelector.isCell(e)) {
            this.cellSelector.onDoubleClick(e);
        }
    };

    private handleKeydown = (e: KeyboardEvent) => {
        this.cellSelector.handleKeydown?.(e);
        this.columnSelector.handleKeydown?.(e);
    };
}