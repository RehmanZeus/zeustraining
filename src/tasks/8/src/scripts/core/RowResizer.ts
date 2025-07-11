import { MIN_GRIDCELL_HEIGHT } from "../constants.js";
import { CellSelector } from "./CellSelector.js";
import { CommandManager } from "./commands/CommandManager";
import { GridMatrix } from "./GridMatrix";
import { RowSelector } from "./RowSelector.js";

export class RowResizer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    gridMatrix: GridMatrix;

    isResizingRow = false;
    resizingRowIndex = -1;

    startX = 0;
    startY = 0;
    initialHeight = 0;

    resizeThreshold = 5;

    commandManager?: CommandManager;
    cellSelector?: CellSelector;
    rowSelector?: RowSelector

    lastResizeRowOldHeight: number | null = null;
    previewRowHeight: number | null = null;

    redrawGrid: () => void = () => { };


    private viewportStartRow: number = 0;
    private viewportEndRow: number = 0;


    constructor(cv: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix) {
        this.canvas = cv;
        this.ctx = ctx;
        this.gridMatrix = gridMatrix
    }

    setCommandManager(cm: CommandManager) {
        this.commandManager = cm;
    }

    setRowSelector(rs: RowSelector){
        this.rowSelector = rs;
    }

    setCellSelector(cs: CellSelector){
        this.cellSelector = cs;
    }

    /**
     * Gets the mouse position for edge detection.
     * @param e Takes a pointer event and returns the mouse position relative to the grid content (ignoring scroll).
     * This is used for edge detection logic, so DO NOT add scroll offset here!
     * @returns The mouse position relative to the grid content.
     */
    getMousePositionForEdgeDetection(e: PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    /**
     * 
     * @param startRow defines the row from where to start rendering
     * @param endRow defines the row from where to stop rendering
     */
    setViewportForRows(startRow: number, endRow: number) {
        this.viewportStartRow = startRow;
        this.viewportEndRow = endRow;
    }

    /**
        * Handles the resizing logic for columns and rows.
        * @param e Takes a pointer event and updates the grid dimensions accordingly.
        */
    handleResize(e: PointerEvent) {
        const { y } = this.getMousePositionForEdgeDetection(e);
        let changed = false;


        if (this.isResizingRow && this.resizingRowIndex >= 0) {
            const delta = y - this.startY;
            const newHeight = Math.max(MIN_GRIDCELL_HEIGHT, this.initialHeight + delta);
            if (this.gridMatrix.rowHeights[this.resizingRowIndex] !== newHeight) {
                this.gridMatrix.rowHeights[this.resizingRowIndex] = newHeight;
                changed = true;
            }
        }
        if (changed) {
            this.redrawGrid();
        }
    }

    previewDrawResizeRow(rowIndex: number, previewHeight: number, initialHeight: number) {
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;
        const viewport = this.gridMatrix.getViewportBounds(scrollLeft, scrollTop, viewportWidth, viewportHeight);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let cellSelectionArr = [];
        if (this.cellSelector && this.cellSelector.selectionStartRow !== -1 && this.cellSelector.selectionEndRow !== -1) {
            for (let i = this.cellSelector.selectionStartRow; i <= this.cellSelector.selectionEndRow; ++i) {
                cellSelectionArr.push(i);
            }
        }

        // Draw grid with preview ONLY for row header, and suppress header selection color
        this.gridMatrix.drawGrid(
            this.ctx,
            viewport,
            scrollLeft,
            scrollTop,
            undefined, // previewColIndex
            undefined, // previewColWidth
            true,      // suppressHeaderSelectionColor
            undefined, // selectedColP (for column highlight)
            cellSelectionArr, // cellSelectionArr (for column/row highlight)
            rowIndex,  // previewRowIndex
            previewHeight, // previewRowHeight
            this.rowSelector?.selectedRows
        );

        // Draw overlays for selection (they will skip header fill if suppressHeaderSelectionColor is true)
        if (this.cellSelector) {
            this.cellSelector.drawSelection(this.ctx, scrollLeft, scrollTop, true);
        }
        if (this.rowSelector) {
            // Pass previewRowIndex and previewRowHeight, suppressHeaderSelectionColor:true for preview overlay
            this.rowSelector.drawSelection(
                this.ctx, scrollLeft, scrollTop,
                rowIndex, previewHeight, true
            );
        }
        if (this.cellSelector?.colSelector) {
            this.cellSelector.colSelector.drawSelection(this.ctx, scrollLeft, scrollTop, undefined, undefined, true);
        }

        // Y for top of row 
        let y = 0;
        for (let i = 0; i < rowIndex; i++) y += this.gridMatrix.rowHeights[i];

        // Green top border for header
        this.ctx.save();
        this.ctx.strokeStyle = "#137e43";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.gridMatrix.columnWidths[0], y - scrollTop);
        this.ctx.lineTo(container.clientWidth, y - scrollTop);
        this.ctx.stroke();

        // Green bottom border for header (at initial/original height)
        this.ctx.beginPath();
        this.ctx.moveTo(this.gridMatrix.columnWidths[0], y + initialHeight - scrollTop);
        this.ctx.lineTo(container.clientWidth, y + initialHeight - scrollTop);
        this.ctx.stroke();
        this.ctx.restore();

        // Dotted line at previewHeight for header
        this.ctx.save();
        this.ctx.setLineDash([6, 4]);
        this.ctx.strokeStyle = "#1a7f37";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.gridMatrix.columnWidths[0], y + previewHeight - scrollTop);
        this.ctx.lineTo(container.clientWidth, y + previewHeight - scrollTop);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }

    /**
     * Returns true if pointer is near a row edge in the row header area (col 0)
     * Uses canvas-relative pointer position for hit-testing (ignores scroll offset)
     */
    isNearRowEdge(e: PointerEvent): boolean {
        const rect = this.canvas.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;
        const container = document.getElementById('excel-container') as HTMLDivElement;


        // X uses scrollLeft only when to the right of the sticky header
        const headerWidth = this.gridMatrix.columnWidths[0];
        const x = rawX + (rawX > headerWidth ? container.scrollLeft : 0);
        if (x > headerWidth) {
            this.resizingRowIndex = -1;
            return false;
        }

        // Y always uses scrollTop (rows still slide under the sticky row header)
        const y = rawY + container.scrollTop;

        // Compute hidden height of rows above viewportStartRow
        const hiddenOffset = this.gridMatrix.rowHeights
            .slice(0, this.viewportStartRow)
            .reduce((sum, h) => sum + h, 0);

        // Walk visible rows
        let cumY = hiddenOffset;
        for (let row = this.viewportStartRow; row < this.viewportEndRow; row++) {
            const h = this.gridMatrix.rowHeights[row];
            const bottomEdge = cumY + h;

            if (Math.abs(y - bottomEdge) < this.resizeThreshold) {
                if (row === 0) return false;
                this.resizingRowIndex = row;
                return true;
            }
            cumY = bottomEdge;
            if (cumY > y + this.resizeThreshold) break;
        }

        this.resizingRowIndex = -1;
        return false;
    }


}