import { MIN_GRIDCELL_HEIGHT } from "../constants.js";
import { CommandManager } from "./commands/CommandManager";
import { GridMatrix } from "./GridMatrix";

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

    lastResizeRowOldHeight: number | null = null;

    
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