import { CellSelector } from "./CellSelector";
import { ColumnSelector } from "./ColumnSelector";
import { CellEditCommand } from "./commands/CellEditCommand.js";
import { CommandManager } from "./commands/CommandManager";
import { GridCell } from "./GridCell.js";
import { GridMatrix } from "./GridMatrix";
import { RowSelector } from "./RowSelector";

/**
 * This class allows inserting Excel-like formulas (SUM, AVERAGE, etc.) into the selected cell.
 * When you call one of the handlers, it writes the formula as =FUNCTION(RANGE) and triggers a redraw.
 */
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

    /**
     * Inserts an =AVERAGE(range) formula into the selected cell, using the current selection.
     */
    avgCalcHandler() {
        const cell = this.cellSelector.getSelectedCell();
        if (!cell) return 0;
        this.calcMode = true;
        const sel = this.cellSelector.getRangeSelectionData();
        // If a range is selected, use that, otherwise just the selected cell
        const cellRef = sel
            ? `${this.cellSelector.gridMatrix.colLetterToIndex(GridCell.generateHeader(sel.startCol - 1)) >= 1
                ? GridCell.generateHeader(sel.startCol - 1) : ""}${sel.startRow}:${GridCell.generateHeader(sel.endCol - 1)}${sel.endRow}`
            : this.cellSelector.getSelectedCellReference();
        this.command.executeCommand(
            new CellEditCommand(cell.cell, this.cellSelector, cell.cell.data ? cell.cell.data : "", `=AVERAGE(${cellRef})`)
        );
        this.cellSelector.redrawGrid();
    }

    /**
     * Inserts a =SUM(range) formula into the selected cell, using the current selection.
     */
    sumCalcHandler() {
        const cell = this.cellSelector.getSelectedCell();
        if (!cell) return 0;
        this.calcMode = true;
        const sel = this.cellSelector.getRangeSelectionData();
        const cellRef = sel
            ? `${GridCell.generateHeader(sel.startCol - 1)}${sel.startRow}:${GridCell.generateHeader(sel.endCol - 1)}${sel.endRow}`
            : this.cellSelector.getSelectedCellReference();
        this.command.executeCommand(
            new CellEditCommand(cell.cell, this.cellSelector, cell.cell.data ? cell.cell.data : "", `=SUM(${cellRef})`)
        );
        this.cellSelector.redrawGrid();
    }
}