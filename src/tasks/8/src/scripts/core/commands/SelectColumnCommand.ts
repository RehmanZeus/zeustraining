import { Command } from "./Command";
import { ColumnSelector } from "../ColumnSelector";

export class SelectColumnCommand implements Command {
    private columnSelector: ColumnSelector;
    private oldSelectedCols: number[];
    private newSelectedCols: number[];

    constructor(columnSelector: ColumnSelector, oldSelectedCols: number[], newSelectedCols: number[]) {
        this.columnSelector = columnSelector;
        this.oldSelectedCols = [...oldSelectedCols];
        this.newSelectedCols = [...newSelectedCols];
    }

    execute(): void {
        this.columnSelector.selectedCols = [...this.newSelectedCols];
        this.columnSelector.selectedCol = this.newSelectedCols.length > 0 ? this.newSelectedCols[this.newSelectedCols.length - 1] : -1;
        this.columnSelector.redrawGrid();
    }

    undo(): void {
        this.columnSelector.selectedCols = [...this.oldSelectedCols];
        this.columnSelector.selectedCol = this.oldSelectedCols.length > 0 ? this.oldSelectedCols[this.oldSelectedCols.length - 1] : -1;
        this.columnSelector.redrawGrid();
    }

    redo(): void {
        this.execute();
    }
}