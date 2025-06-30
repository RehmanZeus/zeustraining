import { Command } from "./Command";
import { RowSelector } from "../RowSelector";

/**
 * The SelectRowCommand class implements the Command interface to handle row selection changes.
 * It allows for executing, undoing, and redoing row selection changes in a grid.
 */
export class SelectRowCommand implements Command{
    /** The RowSelector instance that manages row selection */
    private rowSelector: RowSelector;
    /** The previously selected rows before the command was executed */
    private oldSelectedRows: number[];
    /** The new selected rows after the command is executed */
    private newSelectedRows: number[];


    /**
     * Creates an instance of SelectRowCommand.
     * @param rowSelector The RowSelector instance to manage row selection.
     * @param oldSelectedRows The previously selected rows before the command was executed.
     * @param newSelectedRows The new selected rows after the command is executed.
     */
    constructor(rowSelector: RowSelector, oldSelectedRows: number[], newSelectedRows: number[]){
        this.rowSelector = rowSelector;
        this.oldSelectedRows = oldSelectedRows;
        this.newSelectedRows = newSelectedRows;
    }

    /**
     * Executes the command to change the selected rows.
     * This updates the row selector's selected rows and redraws the grid.
     */
    execute(): void {
        this.rowSelector.selectedRows = [...this.newSelectedRows];
        this.rowSelector.selectedRow = this.newSelectedRows.length > 0 ? this.newSelectedRows[this.newSelectedRows.length - 1]: -1;
        this.rowSelector.redrawGrid();
    }

    /**
     * Undoes the command, restoring the previous row selection.
     */
    undo(): void {
        this.rowSelector.selectedRows = [...this.oldSelectedRows];
        this.rowSelector.selectedRow = this.oldSelectedRows.length > 0 ? this.oldSelectedRows[this.oldSelectedRows.length - 1] : -1;
        this.rowSelector.redrawGrid();
    }
    
    /**
     * Redoes the command, reapplying the new row selection.
     * This is typically called after an undo operation.
     */
    redo(): void {
        this.execute();
    }
}