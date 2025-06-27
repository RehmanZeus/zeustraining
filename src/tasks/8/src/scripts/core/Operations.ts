import { ColumnSelector } from "./ColumnSelector";
import { GridMatrix } from "./GridMatrix";
import { RowSelector } from "./RowSelector";
import { CellSelector } from "./CellSelector";

export class Operations{

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


    sumRows(){
        const selectedRowData = this.cols.getSelectedColData();
        if(!selectedRowData) return 0;
        let sum = 0;
        for(let x = 0; x < selectedRowData.length; ++x){
            if(x === 0) continue;
            sum += parseInt(selectedRowData[x]);
        }
    }

    rangeSelectionSum(): number {
        const selectedRange = this.cellSelector.getRangeSelectionData();
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
}