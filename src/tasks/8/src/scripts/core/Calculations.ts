import { CellSelector } from "./CellSelector";
import { ColumnSelector } from "./ColumnSelector";
import { CellEditCommand } from "./commands/CellEditCommand.js";
import { CommandManager } from "./commands/CommandManager";
import { GridMatrix } from "./GridMatrix";
import { RowSelector } from "./RowSelector";

export class Calculations {

    cellSelector: CellSelector;
    colSelector: ColumnSelector;
    rowSelector: RowSelector;
    gridMatrix: GridMatrix;
    ctx: CanvasRenderingContext2D;
    command: CommandManager;
    calcMode: boolean = false;


    constructor(cs: CellSelector, clm: ColumnSelector, rws: RowSelector, gm: GridMatrix, ctx: CanvasRenderingContext2D, cmnd: CommandManager) {
        this.cellSelector = cs;
        this.colSelector = clm;
        this.rowSelector = rws;
        this.gridMatrix = gm;
        this.ctx = ctx;
        this.command = cmnd;
    }

    avgCalcHandler() {

        const cell = this.cellSelector.getSelectedCell();
        if (!cell) return 0;
        this.calcMode = true
        this.command.executeCommand(
            new CellEditCommand(cell.cell, this.cellSelector, cell.cell.data ? cell.cell.data : "", `=AVERAGE(${this.cellSelector.getSelectedCellReference()})`)
        )
     
    }
}