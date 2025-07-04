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

  
    /**
     * Creates an instance of CellEditCommand.
     * @param gcell The GridCell being edited
     * @param cell The CellSelector instance for managing cell selection and redraws
     * @param oldData The previous data in the cell before the edit
     * @param newData The new data to set in the cell
     */
    constructor(gcell: GridCell, cell: CellSelector, oldData: string, newData: string){
        
        this.cellSelector = cell;
        this.oldCellData = oldData;
        this.newCellData = newData;
        this.cell = gcell;
    }


    /**
     * Executes the command to update the cell data.
     * This method sets the new data in the cell and redraws the grid.
     */
    execute(): void {
        
        this.cell.data = this.newCellData;
        console.log(this.cell.data , this.newCellData)
        this.cellSelector.redrawGrid();
    }

    /**
     * Undoes the last cell edit by restoring the old data.
     * This method sets the cell data back to the previous state and redraws the grid.
     */
    undo(): void {
       
        this.cell.data = this.oldCellData;
        this.cellSelector.redrawGrid();
    }

    /**
     * Redoes the last undone cell edit by reapplying the new data.
     * This method sets the cell data to the new value again and redraws the grid.
     */
    redo(): void {
        this.execute();
        this.cellSelector.redrawGrid();
    }
}