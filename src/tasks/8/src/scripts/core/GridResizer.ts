import { DPR, MIN_GRIDCELL_HEIGHT, MIN_GRIDCELL_WIDTH } from "../constants.js";
import { CellSelector } from "./CellSelector.js";
import { GridMatrix } from "./GridMatrix.js";

export class GridResizer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    gridMatrix: GridMatrix;
    cellSelector?: CellSelector;

    isResizingCol = false;
    isResizingRow = false;
    resizingColIndex = -1;
    resizingRowIndex = -1;

    startX = 0;
    startY = 0;
    initialWidth = 0;
    initialHeight = 0;

    resizeThreshold = 5;
    redrawGrid: () => void = () => { };

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;
        this.attachEvents();
    }

    setCellSelector(cellSelector: CellSelector) {
        this.cellSelector = cellSelector;
    }

    setRedrawGridCallback(redrawFn: () => void) {
        this.redrawGrid = redrawFn;
    }

    attachEvents() {
        this.canvas.addEventListener("pointermove", this.handleMouseMove.bind(this));
        this.canvas.addEventListener("pointerdown", this.handleMouseDown.bind(this));
        this.canvas.addEventListener("pointerup", this.handleMouseUp.bind(this));
    }

    updateColumnLayout(colIndex: number) {
        let x = this.gridMatrix.columnWidths.slice(0, colIndex).reduce((a, b) => a + b, 0);
        let width = this.gridMatrix.columnWidths[colIndex];
        for (let row = 0; row < this.gridMatrix.noOfRows; row++) {
            let y = this.gridMatrix.rowHeights.slice(0, row).reduce((a, b) => a + b, 0);
            const cell = this.gridMatrix.getCell(row, colIndex);
            cell.x = x;
            cell.y = y;
            cell.width = width;
            cell.height = this.gridMatrix.rowHeights[row];
        }
    }

    updateRowLayout(rowIndex: number) {
        let y = this.gridMatrix.rowHeights.slice(0, rowIndex).reduce((a, b) => a + b, 0);
        let height = this.gridMatrix.rowHeights[rowIndex];
        for (let col = 0; col < this.gridMatrix.noOfCols; col++) {
            let x = this.gridMatrix.columnWidths.slice(0, col).reduce((a, b) => a + b, 0);
            const cell = this.gridMatrix.getCell(rowIndex, col);
            cell.x = x;
            cell.y = y;
            cell.width = this.gridMatrix.columnWidths[col];
            cell.height = height;
        }
    }

    handleMouseMove(e: PointerEvent) {
        if (this.isResizingCol || this.isResizingRow) {
            this.handleResize(e);
            return;
        }

        const { x, y } = this.getMousePosition(e);
        const { nearColEdge, colIndex } = this.isNearColumnEdge(x);
        const { nearRowEdge, rowIndex } = this.isNearRowEdge(y);

        if (nearColEdge && colIndex > 0) {
            this.canvas.style.cursor = "col-resize";
        } else if (nearRowEdge && rowIndex > 0) {
            this.canvas.style.cursor = "row-resize";
        } else {
            this.canvas.style.cursor = "default";
        }
    }

    handleMouseDown(e: PointerEvent) {
        const { x, y } = this.getMousePosition(e);
        const { nearColEdge, colIndex } = this.isNearColumnEdge(x);
        const { nearRowEdge, rowIndex } = this.isNearRowEdge(y);

        if (nearColEdge && colIndex > 0) {
            this.isResizingCol = true;
            this.resizingColIndex = colIndex;
            this.startX = x;
            this.initialWidth = this.gridMatrix.columnWidths[colIndex];
            this.canvas.style.cursor = "col-resize";
            e.preventDefault();
        } else if (nearRowEdge && rowIndex > 0) {
            this.isResizingRow = true;
            this.resizingRowIndex = rowIndex;
            this.startY = y;
            this.initialHeight = this.gridMatrix.rowHeights[rowIndex];
            this.canvas.style.cursor = "row-resize";
            e.preventDefault();
        }
    }

    handleMouseUp(e: PointerEvent) {
        this.isResizingCol = false;
        this.isResizingRow = false;
        this.resizingColIndex = -1;
        this.resizingRowIndex = -1;
        this.canvas.style.cursor = "default";
    }

    updateGridLayout() {
        let y = 0;
        for (let row = 0; row < this.gridMatrix.noOfRows; row++) {
            let x = 0;
            for (let col = 0; col < this.gridMatrix.noOfCols; col++) {
                const cell = this.gridMatrix.getCell(row, col);
                cell.x = x;
                cell.y = y;
                cell.width = this.gridMatrix.columnWidths[col];
                cell.height = this.gridMatrix.rowHeights[row];
                x += this.gridMatrix.columnWidths[col];
            }
            y += this.gridMatrix.rowHeights[row];
        }
    }

    handleResize(e: PointerEvent) {
        const { x, y } = this.getMousePosition(e);

        let changed = false;

        if (this.isResizingCol && this.resizingColIndex >= 0) {
            const delta = x - this.startX;
            const newWidth = Math.max(MIN_GRIDCELL_WIDTH, this.initialWidth + delta);

            if (this.gridMatrix.columnWidths[this.resizingColIndex] !== newWidth) {
                this.gridMatrix.columnWidths[this.resizingColIndex] = newWidth;
                this.updateColumnLayout(this.resizingColIndex);
                changed = true;
            }
        }

        if (this.isResizingRow && this.resizingRowIndex >= 0) {
            const delta = y - this.startY;
            const newHeight = Math.max(MIN_GRIDCELL_HEIGHT, this.initialHeight + delta);

            if (this.gridMatrix.rowHeights[this.resizingRowIndex] !== newHeight) {
                this.gridMatrix.rowHeights[this.resizingRowIndex] = newHeight;
                this.updateRowLayout(this.resizingRowIndex);
                changed = true;
            }
        }

        if (changed) {
            this.updateGridLayout(); // <-- update all cells!
            this.redrawGrid();
        }
    }

    /**
     * Only update positions/dimensions for cells in the visible viewport + headers.
     */
    updateGridLayoutViewport() {

        if (this.isResizingCol && this.resizingColIndex >= 0) {
            this.updateColumnLayout(this.resizingColIndex);
        }
        if (this.isResizingRow && this.resizingRowIndex >= 0) {
            this.updateRowLayout(this.resizingRowIndex);
        }
    }

    isNearColumnEdge(x: number): { nearColEdge: boolean, colIndex: number } {
        let total = 0;
        for (let i = 0; i < this.gridMatrix.columnWidths.length; i++) {
            total += this.gridMatrix.columnWidths[i];
            if (Math.abs(x - total) < this.resizeThreshold) {
                return { nearColEdge: true, colIndex: i };
            }
        }
        return { nearColEdge: false, colIndex: -1 };
    }

    isNearRowEdge(y: number): { nearRowEdge: boolean, rowIndex: number } {
        let total = 0;
        for (let i = 0; i < this.gridMatrix.rowHeights.length; i++) {
            total += this.gridMatrix.rowHeights[i];
            if (Math.abs(y - total) < this.resizeThreshold) {
                return { nearRowEdge: true, rowIndex: i };
            }
        }
        return { nearRowEdge: false, rowIndex: -1 };
    }

    getMousePosition(e: PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const container = this.canvas.parentElement!;
        return {
            x: e.clientX - rect.left + container.scrollLeft,
            y: e.clientY - rect.top + container.scrollTop
        };
    }
}