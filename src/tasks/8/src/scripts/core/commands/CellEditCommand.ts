import {Command} from './Command';
import { CellSelector } from '../CellSelector';
import { GridMatrix } from '../GridMatrix';

export class CellEditCommand implements Command{
    private cellSelector: CellSelector;
    private gridMatrix: GridMatrix;
    private oldCellData: string;
    private newCellData: string;
    private cellRow: number;
    private cellCol: number;

    constructor(gridM: GridMatrix, cell: CellSelector, oldData: string, newData: string, cellRow: number, cellCol: number){
        
        this.gridMatrix = gridM;
        this.cellSelector = cell;
        this.oldCellData = oldData;
        this.newCellData = newData;
        this.cellCol = cellCol;
        this.cellRow = cellRow;
    }


    execute(): void {
        const cell = this.gridMatrix.getCell(this.cellRow, this.cellCol);
        cell.data = this.newCellData;
        this.cellSelector.redrawGrid();
    }

    undo(): void {
        const cell = this.gridMatrix.getCell(this.cellRow, this.cellCol);
        cell.data = this.oldCellData;
        this.cellSelector.redrawGrid();
    }

    redo(): void {
        this.execute();
        this.cellSelector.redrawGrid();
    }
}