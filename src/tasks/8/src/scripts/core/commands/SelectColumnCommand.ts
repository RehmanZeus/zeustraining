import { Command } from "./Command";
import { ColumnSelector } from "../ColumnSelector";

/**
 * The SelectColumnCommand class implements the Command interface to handle column selection changes.
 * It allows for executing, undoing, and redoing column selection changes in a grid.
 */
export class SelectColumnCommand implements Command {
    /** The ColumnSelector instance that manages column selection */
    private columnSelector: ColumnSelector;
    /** The previously selected columns before the command was executed */
    private oldSelectedCols: number[];
    /** The new selected columns after the command is executed */
    private newSelectedCols: number[];


    /**
     * Creates an instance of SelectColumnCommand.
     * @param columnSelector The ColumnSelector instance to manage column selection.
     * @param oldSelectedCols The previously selected columns before the command was executed.
     * @param newSelectedCols The new selected columns after the command is executed.
     */
    constructor(columnSelector: ColumnSelector, oldSelectedCols: number[], newSelectedCols: number[]) {
        this.columnSelector = columnSelector;
        this.oldSelectedCols = [...oldSelectedCols];
        this.newSelectedCols = [...newSelectedCols];
    }

    /**
     * Executes the command to change the selected columns.
     * This updates the column selector's selected columns and redraws the grid.
     */
    execute(): void {
        this.columnSelector.selectedCols = [...this.newSelectedCols];
        this.columnSelector.selectedCol = this.newSelectedCols.length > 0 ? this.newSelectedCols[this.newSelectedCols.length - 1] : -1;
        this.columnSelector.redrawGrid();
    }

    /**
     * Undoes the command, restoring the previous column selection.
     */
    undo(): void {
        this.columnSelector.selectedCols = [...this.oldSelectedCols];
        this.columnSelector.selectedCol = this.oldSelectedCols.length > 0 ? this.oldSelectedCols[this.oldSelectedCols.length - 1] : -1;
        this.columnSelector.redrawGrid();
    }

    /**
     * Redoes the command, reapplying the new column selection.
     * This is typically called after an undo operation.
     */
    redo(): void {
        this.execute();
    }
}