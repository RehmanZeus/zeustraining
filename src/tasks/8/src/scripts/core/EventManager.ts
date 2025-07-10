import { GridMatrix } from "./GridMatrix.js";
import { RowResizeStrategy } from "./strategies/RowResizeStrategy.js";
import { RowResizer } from "./RowResizer.js";
import { ColumnResizer } from "./ColumnResizer.js";
import { ColumnResizeStrategy } from "./strategies/ColumnResizeStrategy.js";

export class EventManager {
    rowResizer: RowResizer;
    gridMatrix: GridMatrix;
    colResizer: ColumnResizer;
    strategies: [RowResizeStrategy, ColumnResizeStrategy];
    activeStrategy: RowResizeStrategy | ColumnResizeStrategy | null = null;

    constructor(
        rowR: RowResizer,
        gm: GridMatrix,
        colR: ColumnResizer
    ) {
        this.rowResizer = rowR;
        this.gridMatrix = gm;
        this.colResizer = colR;
        this.strategies = [
            new RowResizeStrategy(this.rowResizer, this.gridMatrix),
            new ColumnResizeStrategy(this.colResizer, this.gridMatrix)
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
            // Let each strategy decide cursor
            let found = false;
            for (const strategy of this.strategies) {
                if (strategy.hitTest(e)) {
                    strategy.onPointerMove(e);
                    found = true;
                    break;
                }
            }
            if (!found) {
                // Let all strategies reset their own cursor if not active
                this.strategies.forEach(s => s.onPointerMove(e));
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