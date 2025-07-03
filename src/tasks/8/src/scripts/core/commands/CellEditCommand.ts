import {Command} from './Command';
import { CellSelector } from '../CellSelector';
import { GridCell } from '../GridCell';

export class CellEditCommand implements Command{

    /** Instance of the cellSelection class with the redrawGrid method on selection */
    private cellSelector: CellSelector;

    /** Previous data of the gridcell */
    private oldCellData: string;
    /** New data to update to the gridcell */
    private newCellData: string;

    private cell: GridCell

  
    constructor(gcell: GridCell, cell: CellSelector, oldData: string, newData: string){
        
        this.cellSelector = cell;
        this.oldCellData = oldData;
        this.newCellData = newData;
        this.cell = gcell;
    }


    execute(): void {
        
        this.cell.data = this.newCellData;
        console.log(this.cell.data , this.newCellData)
        this.cellSelector.redrawGrid();
    }

    undo(): void {
       
        this.cell.data = this.oldCellData;
        this.cellSelector.redrawGrid();
    }

    redo(): void {
        this.execute();
        this.cellSelector.redrawGrid();
    }
}