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

export class EventManager {
    rowResizer: RowResizer;
    gridMatrix: GridMatrix;
    colResizer: ColumnResizer;
    cellSelector: CellSelector;
    rowSelector: RowSelector;
    columnSelector: ColumnSelector;
    strategies: [RowResizeStrategy, ColumnResizeStrategy, ColumnSelectorStrategy, RowSelectorStrategy];
    activeStrategy: RowResizeStrategy | ColumnResizeStrategy | ColumnSelectorStrategy | RowSelectorStrategy | null = null;

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
            new RowSelectorStrategy(this.rowSelector,  this.cellSelector, this.gridMatrix)
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
            
            if(this.activeStrategy){
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
}