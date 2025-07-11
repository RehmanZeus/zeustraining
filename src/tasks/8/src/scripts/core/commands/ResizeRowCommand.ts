import { Command } from "./Command";
import { GridMatrix } from "../GridMatrix";
import { RowResizer } from "../RowResizer";

export class ResizeRowCommand implements Command {
    private gridMatrix: GridMatrix;
    private rowIndex: number;
    private oldHeight: number;
    private newHeight: number;
    private gridResizer: RowResizer
    container: HTMLDivElement
    constructor(gridMatrix: GridMatrix, rowIndex: number, oldHeight: number, newHeight: number, gridResizer: RowResizer) {
        this.gridMatrix = gridMatrix;
        this.rowIndex = rowIndex;
        this.oldHeight = oldHeight;
        this.newHeight = newHeight;
        this.gridResizer = gridResizer
        this.container = document.getElementById('excel-container') as HTMLDivElement;

    }

    execute(): void {
        this.gridMatrix.rowHeights[this.rowIndex] = this.newHeight;
        this.gridResizer.redrawGrid();
    }

    undo(): void {
        this.gridMatrix.rowHeights[this.rowIndex] = this.oldHeight;
        this.gridResizer.redrawGrid();
    }

    redo(): void {
        this.execute();
        this.gridResizer.redrawGrid();
    }
}