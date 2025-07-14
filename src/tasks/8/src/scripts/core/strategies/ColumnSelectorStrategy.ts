import { CellSelector } from "../CellSelector";
import { ColumnSelector } from "../ColumnSelector";
import { GridMatrix } from "../GridMatrix";
import { Strategy } from "./Strategy.js";

export class ColumnSelectorStrategy implements Strategy {

    columnSelector: ColumnSelector;
    cellSelector: CellSelector;
    gridMatrix: GridMatrix

    constructor(c: ColumnSelector, cell: CellSelector, gm: GridMatrix) {
        this.columnSelector = c;
        this.cellSelector = cell;
        this.gridMatrix = gm;
    }

    hitTest(e: PointerEvent): boolean {
        return this.columnSelector.isColumnHeader(e)
    }

    onPointerDown(e: PointerEvent): void {
        this.columnSelector.dragStartCol = null;
        this.cellSelector?.selectCell(-1, -1);
        if (!this.columnSelector.isColumnHeader(e)) return;
        if (e.button !== 0) return;

        const colIndex = this.columnSelector.getColFromMouseEvent(e);
        if (colIndex < 0) return;

        this.columnSelector.dragStarted = false;
        this.columnSelector.pointerDownCol = colIndex;

        // Ctrl/Cmd+Click: toggle multi-select, but do not drag
        if (e.ctrlKey || e.metaKey) {
            const idx = this.columnSelector.selectedCols.indexOf(colIndex);
            if (idx === -1) {
                this.columnSelector.selectedCols.push(colIndex);
                this.columnSelector.selectedCol = colIndex;
            } else {
                this.columnSelector.selectedCols.splice(idx, 1);
                this.columnSelector.selectedCol = this.columnSelector.selectedCols.length ? this.columnSelector.selectedCols[this.columnSelector.selectedCols.length - 1] : -1;
            }
            if (this.cellSelector) {
                this.cellSelector.clearRangeSelection();
                this.cellSelector.selectedRow = -1;
                this.cellSelector.selectedCol = -1;
                this.cellSelector.isEditing = false;
                this.cellSelector.inputElement.style.display = 'none';
            }
            this.columnSelector.redrawGrid();
            // prepare for possible ctrl+drag
        }

        // Always prepare for drag (ctrl or not)
        this.columnSelector.isDragging = true;
        this.columnSelector.dragStartCol = colIndex;
        this.columnSelector.initialSelectedCols = (e.ctrlKey || e.metaKey) ? [...this.columnSelector.selectedCols] : [colIndex];

        // window.addEventListener('pointermove', this.onPointerMove);
        // window.addEventListener('pointerup', this.onPointerUp);
    }

    onPointerMove(e: PointerEvent): void {
        if (!this.columnSelector.isDragging || this.columnSelector.dragStartCol === null) return;
        this.columnSelector.dragStarted = true;
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const rect = container.getBoundingClientRect();
        const pointerX = e.clientX;

        if (this.columnSelector.colAutoScroll) {
            this.columnSelector.colAutoScroll.checkAutoScroll(e);
        }

        let colIndex: number = -1;

        if (pointerX < rect.left) {
            const scrollLeft = container.scrollLeft;
            let totalX = 0;
            for (let col = 0; col < this.gridMatrix.columnWidths.length; col++) {
                totalX += this.gridMatrix.columnWidths[col];
                if (totalX > scrollLeft) {
                    colIndex = col;
                    break;
                }
            }
            if (colIndex === -1) colIndex = 1;
        } else if (pointerX > rect.right) {
            const scrollLeft = container.scrollLeft;
            const viewportWidth = container.clientWidth;
            let totalX = 0;
            for (let col = 0; col < this.gridMatrix.columnWidths.length; col++) {
                totalX += this.gridMatrix.columnWidths[col];
                if (totalX > scrollLeft + viewportWidth) {
                    colIndex = col;
                    break;
                }
            }
            if (colIndex === -1) colIndex = this.gridMatrix.noOfCols - 1;
        } else {
            colIndex = this.columnSelector.getColFromMouseEvent(e);
        }

        if (colIndex < 0 || colIndex === this.columnSelector.selectedCol) return;

        const [start, end] = [this.columnSelector.dragStartCol, colIndex].sort((a, b) => a - b);
        let dragCols: number[] = [];
        for (let col = start; col <= end; col++) dragCols.push(col);

        if (e.ctrlKey || e.metaKey) {
            const allCols = Array.from(new Set([...this.columnSelector.initialSelectedCols, ...dragCols]));
            this.columnSelector.selectedCols = allCols.sort((a, b) => a - b);
        } else {
            this.columnSelector.selectedCols = dragCols;
        }
        this.columnSelector.selectedCol = colIndex;
        this.columnSelector.redrawGrid();
    }

    onPointerUp(e: PointerEvent): void {
        if (this.columnSelector.isDragging) {
            this.columnSelector.isDragging = false;
            this.columnSelector.initialSelectedCols = [];
            if (this.columnSelector.colAutoScroll) {
                this.columnSelector.colAutoScroll.clearAutoScroll();
            }
            window.removeEventListener('pointermove', this.onPointerMove);
            window.removeEventListener('pointerup', this.onPointerUp);

            // If simple click (no drag), select only that column (unless ctrl/cmd)
            if (!this.columnSelector.dragStarted && this.columnSelector.pointerDownCol !== null && !(e.ctrlKey || e.metaKey)) {
                this.columnSelector.selectedCols = [this.columnSelector.pointerDownCol];
                this.columnSelector.selectedCol = this.columnSelector.pointerDownCol;
                if (this.cellSelector) {
                    this.cellSelector.clearRangeSelection();
                    this.cellSelector.selectedRow = -1;
                    this.cellSelector.selectedCol = -1;
                    this.cellSelector.isEditing = false;
                    this.cellSelector.inputElement.style.display = 'none';
                }
                this.columnSelector.redrawGrid();
            }
            this.columnSelector.pointerDownCol = null;
            this.columnSelector.dragStarted = false;
        }
    }

    getCursor(): string {
        return "cell";
    }


}