import { ColumnSelector } from "./ColumnSelector";
import { GridMatrix } from "./GridMatrix";
import { RowSelector } from "./RowSelector";

export class Operations{

    rows: RowSelector;
    cols: ColumnSelector
    gridMatrix: GridMatrix;
    ctx: CanvasRenderingContext2D;

    constructor(r: RowSelector, clm: ColumnSelector, g: GridMatrix, c: CanvasRenderingContext2D){
        this.rows = r;
        this.cols = clm;
        this.gridMatrix = g;
        this.ctx = c;
    }


    sumRows(){
        const selectedRowData = this.cols.getSelectedColData();
        if(!selectedRowData) return 0;
        let sum = 0;
        for(let x = 0; x < selectedRowData.length; ++x){
            if(x === 0) continue;
            sum += parseInt(selectedRowData[x]);
        }
        alert(sum);
    }
}