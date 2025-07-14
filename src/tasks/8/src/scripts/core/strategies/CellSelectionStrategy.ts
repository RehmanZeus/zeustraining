import { CellSelector } from "../CellSelector";
import { Strategy } from "./Strategy";

export class CellSelectionStrategy implements Strategy{
    cellSelector: CellSelector;

    constructor(cs: CellSelector){
        this.cellSelector = cs;
    }

    hitTest(e: PointerEvent): boolean {
        return this.cellSelector.isCell(e)
    }

    onPointerDown(e: PointerEvent): void {
         if (e.button !== 0) return;
        this.cellSelector.pointerDownPosition = { x: e.clientX, y: e.clientY };
        this.cellSelector.dragStarted = false;

        if ((e.target as HTMLElement).setPointerCapture) {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }

        if (!this.cellSelector.dragStarted) {
           
            const { x, y } = this.cellSelector.getMousePosition(e);
            const { row, col } = this.cellSelector.getCellFromPosition(x, y);
            this.cellSelector.selectCell(row, col);
            this.cellSelector.colSelector?.clearSelection();
            this.cellSelector.rowSelector?.clearSelection();
            this.cellSelector.clearRangeSelection();
        }



        const { x, y } = this.cellSelector.getMousePosition(e);
        const { row, col } = this.cellSelector.getCellFromPosition(x, y);
        if (row > 0 && col > 0) {
            this.cellSelector.isDragging = true;
            this.cellSelector.selectionStartRow = row;
            this.cellSelector.selectionStartCol = col;
            this.cellSelector.selectionEndRow = row;
            this.cellSelector.selectionEndCol = col;
            // don't clear selection yet
            this.cellSelector.anchorRow = row;
            this.cellSelector.anchorCol = col;


        }
    }

    onPointerMove(e: PointerEvent): void {
        if (!this.cellSelector.isDragging) return;
        if (!this.cellSelector.dragStarted) {
            const dx = Math.abs(e.clientX - this.cellSelector.pointerDownPosition.x);
            const dy = Math.abs(e.clientY - this.cellSelector.pointerDownPosition.y);
            if (dx > 3 || dy > 3) {
                this.cellSelector.dragStarted = true;
                this.cellSelector.selectedRow = -1;
                this.cellSelector.selectedCol = -1;
            }
        }


        if (this.cellSelector.cellAutoScroll) {
            this.cellSelector.cellAutoScroll.checkAutoScroll(e);
        }

        const { x, y } = this.cellSelector.getMousePosition(e);
        const { row, col } = this.cellSelector.getCellFromPosition(x, y);
        if (row > 0 && col > 0) {
            this.cellSelector.selectionEndRow = row;
            this.cellSelector.selectionEndCol = col;
            this.cellSelector.redrawGrid();
        }
    }

    onPointerUp(e: PointerEvent): void {
        if (this.cellSelector.isDragging) {
            this.cellSelector.isDragging = false;
            if ((e.target as HTMLElement).releasePointerCapture) {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            }
            this.cellSelector.dragStarted = false;
            if (this.cellSelector.cellAutoScroll) {
                this.cellSelector.cellAutoScroll.clearAutoScroll();
            }
          
            this.cellSelector.redrawGrid();
        }
    }
    getCursor(): string {
        return "cell";
    }
}