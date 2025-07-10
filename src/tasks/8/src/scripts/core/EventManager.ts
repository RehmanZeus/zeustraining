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

export class EventManager {
    rowResizer: RowResizer;
    gridMatrix: GridMatrix;
    colResizer: ColumnResizer;
    cellSelector: CellSelector;
    rowSelector: RowSelector;
    columnSelector: ColumnSelector;
    strategies: [RowResizeStrategy, ColumnResizeStrategy, ColumnSelectorStrategy, RowSelectorStrategy, CellSelectionStrategy];
    activeStrategy: RowResizeStrategy | ColumnResizeStrategy | ColumnSelectorStrategy | RowSelectorStrategy | CellSelectionStrategy | null = null;
    container = document.getElementById('excel-container') as HTMLDivElement;
    constructor(
        rowR: RowResizer,
        gm: GridMatrix,
        colR: ColumnResizer,
        cellS: CellSelector,
        rowS: RowSelector,
        colS: ColumnSelector
    ) {
        this.rowResizer = rowR;
        this.gridMatrix = gm;
        this.colResizer = colR;
        this.columnSelector = colS;
        this.cellSelector = cellS;
        this.rowSelector = rowS;
        this.strategies = [
            new RowResizeStrategy(this.rowResizer, this.gridMatrix),
            new ColumnResizeStrategy(this.colResizer, this.gridMatrix),
            new ColumnSelectorStrategy(this.columnSelector, this.cellSelector, this.gridMatrix),
            new RowSelectorStrategy(this.rowSelector, this.cellSelector, this.gridMatrix),
            new CellSelectionStrategy(this.cellSelector)
        ];
        this.attachEvents();
    }

    findStrategy(e: PointerEvent) {

        for (const strategy of this.strategies) {
            if (strategy.hitTest(e)) {
                return strategy;
            }
        }
        return null;
    }

    attachEvents() {
        window.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        window.addEventListener('pointermove', this.handlePointerMove.bind(this));
        window.addEventListener('pointerup', this.handlePointerUp.bind(this));

        this.container.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    handlePointerDown(e: PointerEvent) {
        this.activeStrategy = this.findStrategy(e);
        if (this.activeStrategy) {
            this.activeStrategy.onPointerDown(e);
        }
    }

    handlePointerMove(e: PointerEvent) {
        if (this.activeStrategy) {
            this.activeStrategy.onPointerMove(e);
        } else {
            this.activeStrategy = this.findStrategy(e);

            if (this.activeStrategy) {
                this.activeStrategy.onPointerMove(e);
            }

        }
    }

    handlePointerUp(e: PointerEvent) {
        if (this.activeStrategy) {
            this.activeStrategy.onPointerUp(e);
            this.activeStrategy = null;
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
        if (typeof this.columnSelector.handleKeydown === "function") {
            this.columnSelector.handleKeydown(e);
        }
    }
}