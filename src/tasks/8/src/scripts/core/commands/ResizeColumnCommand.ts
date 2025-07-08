import { Command } from "./Command";
import { GridMatrix } from "../GridMatrix";
import { GridResizer } from "../GridResizer";

export class ResizeColumnCommand implements Command {

    /** The grid matrix containing all cells and their data */
    private gridMatrix: GridMatrix;
    /** Index of the column that is being resized */
    private colIndex: number;
    /** Old width of the column  */
    private oldWidth: number;
    /** New width of the column */
    private newWidth: number;
    /** Resizer handle for the grid */
    private gridResizer: GridResizer;


    /**
     * 
     * @param gridMatrix The grid matrix containing all cells and their data 
     * @param colIndex Index of the column that is being resized
     * @param oldWidth Old width of the column
     * @param newWidth New width of the column
     * @param gridResizer Resizer handle for the grid
     */
    constructor(gridMatrix: GridMatrix, colIndex: number, oldWidth: number, newWidth: number, gridResizer: GridResizer) {
        this.gridMatrix = gridMatrix;
        this.colIndex = colIndex;
        this.oldWidth = oldWidth;
        this.newWidth = newWidth;
        this.gridResizer = gridResizer;
    }

    /**
     * Sets the column width to the new width and then redraws the grid
     */
    execute(): void {
        this.gridMatrix.columnWidths[this.colIndex] = this.newWidth;
        this.gridResizer.redrawGrid();
    }

    /**
     * Sets the column width to its old width and then redraws the grid
     */
    undo(): void {
        this.gridMatrix.columnWidths[this.colIndex] = this.oldWidth;
        this.gridResizer.redrawGrid();
    }

    /**
     *  Sets the column width to its previous width and then redraws the grid
     */
    redo(): void {
        this.execute();
        this.gridResizer.redrawGrid();
    }
}