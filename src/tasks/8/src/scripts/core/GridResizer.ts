import { MIN_GRIDCELL_HEIGHT, MIN_GRIDCELL_WIDTH } from "../constants.js";
import { CellSelector } from "./CellSelector.js";
import { ColumnSelector } from "./ColumnSelector.js";
import { CommandManager } from "./commands/CommandManager.js";
import { ResizeColumnCommand } from "./commands/ResizeColumnCommand.js";
import { ResizeRowCommand } from "./commands/ResizeRowCommand.js";
import { GridMatrix } from "./GridMatrix.js";

export class GridResizer {


    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    gridMatrix: GridMatrix;
    cellSelector?: CellSelector;
    columnSelector?: ColumnSelector;

    isResizingCol = false;
    isResizingRow = false;
    resizingColIndex = -1;
    resizingRowIndex = -1;

    startX = 0;
    startY = 0;
    initialWidth = 0;
    initialHeight = 0;

    resizeThreshold = 5;
    commandManager?: CommandManager;

    lastResizeRowOldHeight: number | null = null;

    lastResizeColOldWidth: number | null = null;


    redrawGrid: () => void = () => { };

    private previewColWidth: number | null = null;


    // Track visible viewport
    private viewportStartCol: number = 0;
    private viewportEndCol: number = 0;
    private viewportStartRow: number = 0;
    private viewportEndRow: number = 0;

    /**
     * Creates a new GridResizer instance.
     * @param canvas The HTML canvas element where the grid is rendered.
     * @param ctx The 2D rendering context of the canvas.
     * @param gridMatrix The GridMatrix instance that manages the grid data.
     */
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;
    }

    /**
     * Sets the cell selector for the grid resizer.
     * @param cellSelector defines the cellSelector used in the gridMatrix class
     */
    setCellSelector(cellSelector: CellSelector) {
        this.cellSelector = cellSelector;
    }

    setCommandManager(cmdManager: CommandManager) {
        this.commandManager = cmdManager;
    }

    setColumnSelector(c: ColumnSelector) {
        this.columnSelector = c;
    }

    /**
     * Sets the redraw grid callback for the grid resizer.
     * @param redrawFn defines the gridDraw function used in the gridMatrix class
     */
    setRedrawGridCallback(redrawFn: () => void) {
        this.redrawGrid = redrawFn;
    }


    /**
     * 
     * @param startCol defines the column from where to start rendering
     * @param endCol defines the column from where to stop rendering
     * @param startRow defines the row from where to start rendering
     * @param endRow defines the row from where to stop rendering
     */
    setViewport(startCol: number, endCol: number, startRow: number, endRow: number) {
        this.viewportStartCol = startCol;
        this.viewportEndCol = endCol;
        this.viewportStartRow = startRow;
        this.viewportEndRow = endRow;

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
            true, // suppressHeaderSelectionColor
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

    previewRowResize(rowIndex: number, previewHeight: number, initialHeight: number) {
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

        // Draw grid with preview ONLY for header (left column), and suppress selection header color
        this.gridMatrix.drawGrid(
            this.ctx,
            viewport,
            scrollLeft,
            scrollTop,
            undefined,      // previewColIndex (not resizing columns)
            undefined,      // previewColWidth
            true,           // suppressHeaderSelectionColor (so no row header highlight for previewed row)
            this.columnSelector?.selectedCols,
            cellSelectionArr
        );

        // Draw overlays for selection (they will skip fill if preview)
        if (this.cellSelector) {
            this.cellSelector.drawSelection(this.ctx, scrollLeft, scrollTop, undefined);
        }
        if (this.gridMatrix.cellSelector?.rowSelector) {
            // Pass previewRowIndex and previewRowHeight for rowSelector
            this.gridMatrix.cellSelector.rowSelector.drawSelection(
                this.ctx, scrollLeft, scrollTop
            );
        }
        if (this.gridMatrix.cellSelector?.colSelector) {
            this.gridMatrix.cellSelector.colSelector.drawSelection(
                this.ctx, scrollLeft, scrollTop
            );
        }

        // Y for top edge of row
        let y = 0;
        for (let i = 0; i < rowIndex; i++) y += this.gridMatrix.rowHeights[i];

        // Green top border for header (left column)
        this.ctx.save();
        this.ctx.strokeStyle = "#137e43";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(MIN_GRIDCELL_WIDTH, y - scrollTop);
        this.ctx.lineTo(container.clientWidth, y - scrollTop);
        this.ctx.stroke();

        // Green bottom border for header (at initial/original height)
        this.ctx.beginPath();
        this.ctx.moveTo(MIN_GRIDCELL_WIDTH, y + initialHeight - scrollTop);
        this.ctx.lineTo(container.clientWidth, y + initialHeight - scrollTop);
        this.ctx.stroke();
        this.ctx.restore();

        // Dotted line at previewHeight for header
        this.ctx.save();
        this.ctx.setLineDash([6, 4]);
        this.ctx.strokeStyle = "#1a7f37";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(MIN_GRIDCELL_WIDTH, y + previewHeight - scrollTop);
        this.ctx.lineTo(container.clientWidth, y + previewHeight - scrollTop);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }

    /**
     * Handles the pointer down event for resizing.
     * @param e Takes a pointer event and determines if the pointer is near a column or row edge.
     * If it is near a column edge, it starts resizing the column.
     */
    onPointerDown(e: PointerEvent) {
        const { x, y } = this.getMousePositionForEdgeDetection(e);
        if (this.isNearColumnEdge(e) && this.resizingColIndex > 0) {
            this.isResizingCol = true;
            this.startX = x;
            this.initialWidth = this.gridMatrix.columnWidths[this.resizingColIndex];
            this.lastResizeColOldWidth = this.initialWidth; // store old width here
            this.canvas.style.cursor = "ew-resize";
            e.preventDefault();
        } else if (this.isNearRowEdge(e) && this.resizingRowIndex > 0) {
            this.isResizingRow = true;
            this.startY = y;
            this.initialHeight = this.gridMatrix.rowHeights[this.resizingRowIndex];
            this.lastResizeRowOldHeight = this.initialHeight; // store old height here
            this.canvas.style.cursor = "ns-resize";
            e.preventDefault();
        }
    }

    /**
     * Handles the pointer move event for resizing.
     * @param e Takes a pointer event and checks if the pointer is near a column or row edge.
     * If it is, it changes the cursor style to indicate resizing.
     */
    onPointerMove(e: PointerEvent) {
        if (this.isResizingCol && this.resizingColIndex >= 0) {
            const { x } = this.getMousePositionForEdgeDetection(e);
            const delta = x - this.startX;
            const previewWidth = Math.max(MIN_GRIDCELL_WIDTH, this.initialWidth + delta);
            this.previewColWidth = previewWidth;
            this.previewDrawResize(this.resizingColIndex, previewWidth, this.initialWidth);
            return;
        }
        if (this.isResizingRow && this.resizingRowIndex >= 0) {
            // You could implement a similar preview for row resizing if you wish
            this.handleResize(e);
            return;
        }
        if (this.isNearColumnEdge(e) && this.resizingColIndex > 0) {
            this.canvas.style.cursor = "ew-resize";
        } else if (this.isNearRowEdge(e) && this.resizingRowIndex > 0) {
            this.canvas.style.cursor = "ns-resize";
        } else {
            this.canvas.style.cursor = "cell";
        }
    }


    /**
     * Handles the pointer up event for resizing.
     * @param e Takes a pointer event and resets the resizing state.
     */
    onPointerUp(e: PointerEvent) {
        if (this.isResizingCol && this.resizingColIndex >= 0 && this.commandManager) {
            const newWidth = this.previewColWidth ?? this.gridMatrix.columnWidths[this.resizingColIndex];
            if (this.lastResizeColOldWidth !== null && newWidth !== this.lastResizeColOldWidth) {
                this.commandManager.executeCommand(
                    new ResizeColumnCommand(this.gridMatrix, this.resizingColIndex, this.lastResizeColOldWidth, newWidth, this)
                );
            }
            this.gridMatrix.columnWidths[this.resizingColIndex] = newWidth;
        }
        if (this.isResizingRow && this.resizingRowIndex >= 0 && this.commandManager) {
            const newHeight = this.gridMatrix.rowHeights[this.resizingRowIndex];
            if (this.lastResizeRowOldHeight !== null && newHeight !== this.lastResizeRowOldHeight) {
                this.commandManager.executeCommand(
                    new ResizeRowCommand(this.gridMatrix, this.resizingRowIndex, this.lastResizeRowOldHeight, newHeight, this)
                );
            }
        }
        this.isResizingCol = false;
        this.isResizingRow = false;
        this.resizingColIndex = -1;
        this.resizingRowIndex = -1;
        this.canvas.style.cursor = "cell";
        this.lastResizeColOldWidth = null;
        this.lastResizeRowOldHeight = null;
        console.log(this.gridMatrix.columnWidths);
        this.previewColWidth = null;
        this.redrawGrid();
    }

    /**
     * Handles the resizing logic for columns and rows.
     * @param e Takes a pointer event and updates the grid dimensions accordingly.
     */
    handleResize(e: PointerEvent) {
        const { x, y } = this.getMousePositionForEdgeDetection(e);
        let changed = false;

        if (this.isResizingCol && this.resizingColIndex >= 0) {
            const delta = x - this.startX;
            const newWidth = Math.max(MIN_GRIDCELL_WIDTH, this.initialWidth + delta);
            if (this.gridMatrix.columnWidths[this.resizingColIndex] !== newWidth) {
                this.gridMatrix.columnWidths[this.resizingColIndex] = newWidth;
                changed = true;
            }
        }
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
     * Gets the mouse position for actual grid interaction.
     * @param e Takes a pointer event and returns the mouse position relative to the grid content, including scroll offsets.
     * This is used for actual grid interaction (e.g. cell selection), so it includes scroll offsets.
     * @returns The mouse position relative to the grid content, including scroll offsets.
     */
    getMousePosition(e: PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const container = this.canvas.parentElement!;
        return {
            x: e.clientX - rect.left + container.scrollLeft,
            y: e.clientY - rect.top + container.scrollTop
        };
    }
}