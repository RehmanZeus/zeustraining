import { CellSelector } from "../CellSelector";
import { GridMatrix } from "../GridMatrix";
import { RowSelector } from "../RowSelector";
import { Strategy } from "./Strategy";

export class RowSelectorStrategy implements Strategy {

    rowSelector: RowSelector;
    cellSelector: CellSelector;
    gridMatrix: GridMatrix;

    constructor(r: RowSelector, cellS: CellSelector, gm: GridMatrix) {
        this.rowSelector = r;
        this.cellSelector = cellS;
        this.gridMatrix = gm;
    }

    hitTest(e: PointerEvent): boolean {
        return this.rowSelector.isRowHeader(e);
    }

    onPointerDown(e: PointerEvent): void {
        if (!this.rowSelector.isRowHeader(e)) return;
        // Only left click
        if (e.button !== 0) return;

        const rowIndex = this.rowSelector.getRowFromMouseEvent(e);
        if (rowIndex < 1) return;

        this.rowSelector.dragStarted = false;
        this.rowSelector.pointerDownRow = rowIndex;

        // Ctrl/Cmd+Click: toggle row selection, but do not drag unless ctrl+drag
        if (e.ctrlKey || e.metaKey) {
            const idx = this.rowSelector.selectedRows.indexOf(rowIndex);
            if (idx === -1) {
                this.rowSelector.selectedRows.push(rowIndex);
                this.rowSelector.selectedRow = rowIndex;
            } else {
                this.rowSelector.selectedRows.splice(idx, 1);
                this.rowSelector.selectedRow = this.rowSelector.selectedRows.length ? this.rowSelector.selectedRows[this.rowSelector.selectedRows.length - 1] : -1;
            }
            this.cellSelector.clearRangeSelection();
            this.cellSelector.selectedRow = -1;
            this.cellSelector.selectedCol = -1;
            this.cellSelector.isEditing = false;
            this.cellSelector.inputElement.style.display = 'none';
            this.rowSelector.redrawGrid();
        }

        // Always allow drag setup (ctrl or not)
        this.rowSelector.isDragging = true;
        this.rowSelector.dragStartRow = rowIndex;
        if (e.ctrlKey || e.metaKey) {
            this.rowSelector.initialSelectedRows = [...this.rowSelector.selectedRows];
        } else {
            this.rowSelector.initialSelectedRows = [rowIndex];
        }


    }

    onPointerMove(e: PointerEvent): void {
        if (!this.rowSelector.isDragging || this.rowSelector.dragStartRow === null) return;
        this.rowSelector.dragStarted = true;


        const container = document.getElementById('excel-container') as HTMLDivElement;
        const rect = container.getBoundingClientRect();
        const pointerY = e.clientY;

        if (this.rowSelector.rowAutoScroll) {
            this.rowSelector.rowAutoScroll.checkAutoScroll(e);
        }

        let rowIndex: number = -1;

        if (pointerY < rect.top) {
            const scrollTop = container.scrollTop;
            let totalY = 0;
            for (let row = 0; row < this.gridMatrix.rowHeights.length; row++) {
                totalY += this.gridMatrix.rowHeights[row];
                if (totalY > scrollTop) {
                    rowIndex = row;
                    break;
                }
            }
            if (rowIndex === -1) rowIndex = 1;
        } else if (pointerY > rect.bottom) {
            const scrollTop = container.scrollTop;
            const viewportHeight = container.clientHeight;
            let totalY = 0;
            for (let row = 0; row < this.gridMatrix.rowHeights.length; row++) {
                totalY += this.gridMatrix.rowHeights[row];
                if (totalY > scrollTop + viewportHeight) {
                    rowIndex = row;
                    break;
                }
            }
            if (rowIndex === -1) rowIndex = this.gridMatrix.noOfRows - 1;
        } else {
            rowIndex = this.rowSelector.getRowFromMouseEvent(e);
        }

        if (rowIndex < 1 || rowIndex === this.rowSelector.selectedRow) return;



        // Drag selection: select contiguous range
        const [start, end] = [this.rowSelector.dragStartRow, rowIndex].sort((a, b) => a - b);
        let dragRows: number[] = [];
        for (let row = start; row <= end; row++) {
            dragRows.push(row);
        }
        if ((e.ctrlKey || e.metaKey)) {
            // Union with any previous ctrl+click selection
            const allRows = Array.from(new Set([...this.rowSelector.initialSelectedRows, ...dragRows]));
            this.rowSelector.selectedRows = allRows.sort((a, b) => a - b);
        } else {
            // Replace selection with contiguous drag range
            this.rowSelector.selectedRows = dragRows;
        }
        this.rowSelector.selectedRow = rowIndex;
        this.rowSelector.redrawGrid();
    }

    onPointerUp(e: PointerEvent): void {
        if (this.rowSelector.isDragging) {
            this.rowSelector.isDragging = false;
            this.rowSelector.dragStartRow = null;
            this.rowSelector.initialSelectedRows = [];
            if (this.rowSelector.rowAutoScroll) {
                this.rowSelector.rowAutoScroll.clearAutoScroll();

            }
           
            // If simple click (no drag), select only that row (unless ctrl/cmd)
            if (!this.rowSelector.dragStarted && this.rowSelector.pointerDownRow !== null && !(e.ctrlKey || e.metaKey)) {
                this.rowSelector.selectedRows = [this.rowSelector.pointerDownRow];
                this.rowSelector.selectedRow = this.rowSelector.pointerDownRow;
                this.cellSelector.clearRangeSelection();
                this.cellSelector.selectedRow = -1;
                this.cellSelector.selectedCol = -1;
                this.cellSelector.isEditing = false;
                this.cellSelector.inputElement.style.display = 'none';
                this.rowSelector.redrawGrid();
            }
            this.rowSelector.pointerDownRow = null;
            this.rowSelector.dragStarted = false;
        }
    }
}
