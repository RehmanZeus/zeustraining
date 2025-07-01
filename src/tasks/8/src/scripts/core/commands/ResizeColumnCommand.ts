import { Command } from "./Command";
import { GridMatrix } from "../GridMatrix";
import { GridResizer } from "../GridResizer";

export class ResizeColumnCommand implements Command {
    private gridMatrix: GridMatrix;
    private colIndex: number;
    private oldWidth: number;
    private newWidth: number;
    private gridResizer: GridResizer;

    constructor(gridMatrix: GridMatrix, colIndex: number, oldWidth: number, newWidth: number, gridResizer: GridResizer) {
        this.gridMatrix = gridMatrix;
        this.colIndex = colIndex;
        this.oldWidth = oldWidth;
        this.newWidth = newWidth;
        this.gridResizer = gridResizer;
    }

    execute(): void {
        this.gridMatrix.columnWidths[this.colIndex] = this.newWidth;
        this.gridResizer.redrawGrid();
    }

    undo(): void {
        this.gridMatrix.columnWidths[this.colIndex] = this.oldWidth;
        this.gridResizer.redrawGrid();
    }

    redo(): void {
        this.execute();
        this.gridResizer.redrawGrid();
    }
}