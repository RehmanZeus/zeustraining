import { MIN_GRIDCELL_WIDTH } from "../../constants.js";
import { ColumnResizer } from "../ColumnResizer.js";
import { ResizeColumnCommand } from "../commands/ResizeColumnCommand.js";
import { GridMatrix } from "../GridMatrix.js";
import { Strategy } from "./Strategy.js";

export class ColumnResizeStrategy implements Strategy {
    columnResizer: ColumnResizer;
    gridMatrix: GridMatrix;

    constructor(c: ColumnResizer, g: GridMatrix) {
        this.columnResizer = c;
        this.gridMatrix = g;
    }

    hitTest(e: PointerEvent): boolean {
        return this.columnResizer.isNearColumnEdge(e);
    }

    onPointerDown(e: PointerEvent): void {
        const { x } = this.columnResizer.getMousePositionForEdgeDetection(e);
        this.columnResizer.isResizingCol = true;
        this.columnResizer.startX = x;
        this.columnResizer.initialWidth = this.gridMatrix.columnWidths[this.columnResizer.resizingColIndex];
        this.columnResizer.lastResizeColOldWidth = this.columnResizer.initialWidth;
        this.setCursor("ew-resize");
        e.preventDefault();
    }

    onPointerMove(e: PointerEvent): void {
        if (this.columnResizer.isResizingCol) {
            const { x } = this.columnResizer.getMousePositionForEdgeDetection(e);
            const delta = x - this.columnResizer.startX;
            const previewWidth = Math.max(MIN_GRIDCELL_WIDTH, this.columnResizer.initialWidth + delta);
            this.columnResizer.previewColWidth = previewWidth;
            this.columnResizer.previewDrawResize(this.columnResizer.resizingColIndex, previewWidth, this.columnResizer.initialWidth);
            e.preventDefault()
            return;
        }
        if(this.hitTest(e) && this.columnResizer.resizingColIndex > 0){
            this.setCursor("ew-resize");
        }else{
            this.setCursor("cell");
        }
    }

    onPointerUp(e: PointerEvent): void {
        if (!this.columnResizer.isResizingCol) return;
        this.columnResizer.isResizingCol = false;
        const newWidth = this.columnResizer.previewColWidth ?? this.gridMatrix.columnWidths[this.columnResizer.resizingColIndex];
        if (
            this.columnResizer.lastResizeColOldWidth !== null &&
            newWidth !== this.columnResizer.lastResizeColOldWidth &&
            this.columnResizer.commandManager
        ) {
            this.columnResizer.commandManager.executeCommand(
                new ResizeColumnCommand(
                    this.gridMatrix,
                    this.columnResizer.resizingColIndex,
                    this.columnResizer.lastResizeColOldWidth,
                    newWidth,
                    this.columnResizer
                )
            );
        }
        this.gridMatrix.columnWidths[this.columnResizer.resizingColIndex] = newWidth;
        this.columnResizer.previewColWidth = null;
        this.setCursor("cell");
    }

    setCursor(cursor: string) {
        if (this.columnResizer.canvas.style.cursor !== cursor) {
            this.columnResizer.canvas.style.cursor = cursor;
        }
    }
}