import { ColumnSelector } from "./ColumnSelector";
import { GridMatrix } from "./GridMatrix";
import { RowSelector } from "./RowSelector";
import { CellSelector } from "./CellSelector";

export class Operations {

    rows: RowSelector;
    cols: ColumnSelector
    gridMatrix: GridMatrix;
    ctx: CanvasRenderingContext2D;
    cellSelector: CellSelector;

    constructor(r: RowSelector, clm: ColumnSelector, g: GridMatrix, c: CanvasRenderingContext2D, cellSelector: CellSelector) {
        this.rows = r;
        this.cols = clm;
        this.gridMatrix = g;
        this.ctx = c;
        this.cellSelector = cellSelector;
    }




    rangeSelectionSum(selectedRange: {
        startRow: number;
        endRow: number;
        startCol: number;
        endCol: number;
    } | undefined): number {

        if (!selectedRange) return 0;

        let sum = 0;
        for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
            for (let col = selectedRange.startCol; col <= selectedRange.endCol; col++) {
                const cell = this.gridMatrix.getCell(row, col);
                if (cell && cell.data) {
                    sum += parseFloat(cell.data) || 0;
                }
            }
        }
        return sum;
    }


    columnSelectionSum(selectedCols: number[]): number {
        let sum = 0;
        for (let col = 0; col < selectedCols.length; ++col) {
            for (let row = 1; row <= this.gridMatrix.rowHeights.length; ++row) {
                const cell = this.gridMatrix.getCell(row, selectedCols[col]);
                if (cell && cell.data) {
                    sum += parseFloat(cell.data) || 0;
                }
            }
        }

        sum = Math.floor(sum);
        return sum;

    }

    rowSelectionSum(selectedRows: number[]): number {
        let sum = 0;
        for (let row = 0; row < selectedRows.length; ++row) {
            for (let col = 1; col < this.gridMatrix.columnWidths.length; ++col) {
                const cell = this.gridMatrix.getCell(selectedRows[row], col);
                if (cell && cell.data) {
                    sum += parseFloat(cell.data) || 0;
                }
            }
        }

        sum = Math.floor(sum);
        return sum;
    }

    globalSum() {
        const isCellSelection = this.cellSelector.getRangeSelectionData();
        const isColumnSelection = this.cols.selectedCols;
        const isRowSelection = this.rows.selectedRows;


        if (isCellSelection) return this.rangeSelectionSum(isCellSelection);
        if (isColumnSelection.length > 0) return this.columnSelectionSum(isColumnSelection);
        if (isRowSelection.length > 0) return this.rowSelectionSum(isRowSelection);

        return 0;
    }

    
}