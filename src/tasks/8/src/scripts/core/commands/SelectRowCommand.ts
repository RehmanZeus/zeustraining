import { Command } from "./Command";
import { RowSelector } from "../RowSelector";

export class SelectRowCommand implements Command{
    private rowSelector: RowSelector;
    private oldSelectedRows: number[];
    private newSelectedRows: number[];

    constructor(rowSelector: RowSelector, oldSelectedRows: number[], newSelectedRows: number[]){
        this.rowSelector = rowSelector;
        this.oldSelectedRows = oldSelectedRows;
        this.newSelectedRows = newSelectedRows;
    }

    execute(): void {
        this.rowSelector.selectedRows = [...this.newSelectedRows];
        this.rowSelector.selectedRow = this.newSelectedRows.length > 0 ? this.newSelectedRows[this.newSelectedRows.length - 1]: -1;
        this.rowSelector.redrawGrid();
    }

    undo(): void {
        this.rowSelector.selectedRows = [...this.oldSelectedRows];
        this.rowSelector.selectedRow = this.oldSelectedRows.length > 0 ? this.oldSelectedRows[this.oldSelectedRows.length - 1] : -1;
        this.rowSelector.redrawGrid();
    }
    
    redo(): void {
        this.execute();
    }
}