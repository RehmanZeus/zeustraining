import { MIN_GRIDCELL_HEIGHT } from "../constants.js";
import { CellSelector } from "./CellSelector";
import { ColumnSelector } from "./ColumnSelector";
import { CommandManager } from "./commands/CommandManager";
import { GridMatrix } from "./GridMatrix";

export class ColumnResizer {

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    gridMatrix: GridMatrix;



    isResizingCol = false;
    resizingColIndex = -1;

    startX = 0;
    startY = 0;

    initialWidth = 0;

    resizeThreshold = 5;

    commandManager?: CommandManager;
    cellSelector?: CellSelector;
    columnSelector?: ColumnSelector;

    lastResizeColOldWidth: number | null = null;


    redrawGrid: () => void = () => { };

    private viewportStartCol: number = 0;
    private viewportEndCol: number = 0;
    previewColWidth: number | null = null;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gridMatrix = gridMatrix
    }

    setCommandManager(cmdManager: CommandManager) {
        this.commandManager = cmdManager;
    }


    /**
     * 
     * @param startCol defines the column from where to start rendering
     * @param endCol defines the column from where to stop rendering
    */
    setViewport(startCol: number, endCol: number) {
        this.viewportStartCol = startCol;
        this.viewportEndCol = endCol;
    }
    /**
     * Gets the mouse position for edge detection.
     * @param e Takes a pointer event and returns the mouse position relative to the grid content (ignoring scroll).
     * This is used for edge detection logic, so DO NOT add scroll offset here!
     * @returns The mouse position relative to the grid content.
     */
    getMousePositionForEdgeDetection(e: PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();
        // DO NOT add scroll offset here for edge detection!
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    /**
     * 
     * @param e Takes a pointer events helps in determining the position of the mouse on the canvas
     * @returns  true if the mouse pointer is near a column edge otherwise false
    */
    isNearColumnEdge(e: PointerEvent): boolean {
        const rect = this.canvas.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;

        const container = document.getElementById('excel-container') as HTMLDivElement;
        // Y uses scrollTop only when below the sticky header
        const headerHeight = this.gridMatrix.rowHeights[0];
        const y = rawY + (rawY > headerHeight ? container.scrollTop : 0);
        if (y >= headerHeight) {
            this.resizingColIndex = -1;
            return false;
        }

        // X always uses scrollLeft (columns still slide under the sticky header)
        const x = rawX + container.scrollLeft;

        // Compute hidden width of columns left of viewportStartCol
        const hiddenOffset = this.gridMatrix.columnWidths
            .slice(0, this.viewportStartCol)
            .reduce((sum, w) => sum + w, 0);

        // Walk visible columns
        let cumX = hiddenOffset;
        for (let col = this.viewportStartCol; col < this.viewportEndCol; col++) {
            const w = this.gridMatrix.columnWidths[col];
            const rightEdge = cumX + w;

            if (Math.abs(x - rightEdge) < this.resizeThreshold) {
                if (col == 0) return false;
                this.resizingColIndex = col;
                return true;
            }
            cumX = rightEdge;
            if (cumX > x + this.resizeThreshold) break;
        }

        this.resizingColIndex = -1;
        return false;
    }

    previewDrawResize(colIndex: number, previewWidth: number, initialWidth: number) {
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;
        const viewport = this.gridMatrix.getViewportBounds(scrollLeft, scrollTop, viewportWidth, viewportHeight);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let cellSelectionArr = [];
        if (this.cellSelector && this.cellSelector.selectionStartCol !== -1 && this.cellSelector.selectionEndCol !== -1) {
            for (let i = this.cellSelector?.selectionStartCol; i <= this.cellSelector?.selectionEndCol; ++i) {
                cellSelectionArr.push(i);
            }
        }

        console.log(cellSelectionArr)
        // Draw grid with preview ONLY for header, and suppress selection header color
        this.gridMatrix.drawGrid(
            this.ctx,
            viewport,
            scrollLeft,
            scrollTop,
            colIndex,      // previewColIndex
            previewWidth,  // previewColWidth
            false, // suppressHeaderSelectionColor
            this.columnSelector?.selectedCols,
            cellSelectionArr
        );

        // Draw overlays for selection (they will skip fill if preview)
        if (this.cellSelector) {
            this.cellSelector.drawSelection(this.ctx, scrollLeft, scrollTop, true);
        }
        if (this.gridMatrix.cellSelector?.rowSelector) {
            this.gridMatrix.cellSelector.rowSelector.drawSelection(this.ctx, scrollLeft, scrollTop);
        }
        if (this.gridMatrix.cellSelector?.colSelector) {
            // Pass previewColIndex and previewColWidth, suppressHeaderSelectionColor:true for preview overlay
            this.gridMatrix.cellSelector.colSelector.drawSelection(
                this.ctx, scrollLeft, scrollTop,
                colIndex, previewWidth, true
            );
        }

        // X for left edge of column
        let x = 0;
        for (let i = 0; i < colIndex; i++) x += this.gridMatrix.columnWidths[i];


        // Green left border for header
        this.ctx.save();
        this.ctx.strokeStyle = "#137e43";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - scrollLeft, MIN_GRIDCELL_HEIGHT);
        this.ctx.lineTo(x - scrollLeft, container.clientHeight);
        this.ctx.stroke();

        // Green right border for header (at initial/original width)
        this.ctx.beginPath();
        this.ctx.moveTo(x + initialWidth - scrollLeft, MIN_GRIDCELL_HEIGHT);
        this.ctx.lineTo(x + initialWidth - scrollLeft, container.clientHeight);
        this.ctx.stroke();
        this.ctx.restore();

        // Dotted line at previewWidth for header
        this.ctx.save();
        this.ctx.setLineDash([6, 4]);
        this.ctx.strokeStyle = "#1a7f37";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + previewWidth - scrollLeft, MIN_GRIDCELL_HEIGHT);
        this.ctx.lineTo(x + previewWidth - scrollLeft, container.clientHeight);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }


}