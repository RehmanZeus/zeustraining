import { ResizeRowCommand } from "../commands/ResizeRowCommand.js";
import { GridMatrix } from "../GridMatrix.js";
import { RowResizer } from "../RowResizer.js";
import { Strategy } from "./Strategy.js";

export class RowResizeStrategy implements Strategy {
    rowResizer: RowResizer;
    gridMatrix: GridMatrix;

    constructor(r: RowResizer, g: GridMatrix) {
        this.rowResizer = r;
        this.gridMatrix = g;
    }

    hitTest(e: PointerEvent): boolean {
        return this.rowResizer.isNearRowEdge(e);
    }

    onPointerDown(e: PointerEvent): void {
        const { y } = this.rowResizer.getMousePositionForEdgeDetection(e);
        this.rowResizer.isResizingRow = true;
        this.rowResizer.startY = y;
        this.rowResizer.initialHeight = this.gridMatrix.rowHeights[this.rowResizer.resizingRowIndex];
        this.rowResizer.lastResizeRowOldHeight = this.rowResizer.initialHeight;
        this.setCursor("ns-resize");
        e.preventDefault();
    }

    onPointerMove(e: PointerEvent): void {
        if (this.rowResizer.isResizingRow) {
            this.rowResizer.handleResize(e);
            this.setCursor("ns-resize");
        } else if (this.hitTest(e)) {
            this.setCursor("ns-resize");
        } else {
            this.setCursor("cell");
        }
    }

    onPointerUp(e: PointerEvent): void {
        if (!this.rowResizer.isResizingRow) return;
        this.rowResizer.isResizingRow = false;
        if (!this.rowResizer.commandManager) throw new Error("Command manager not assigned");
        const newHeight = this.gridMatrix.rowHeights[this.rowResizer.resizingRowIndex];
        if (this.rowResizer.lastResizeRowOldHeight !== null && newHeight !== this.rowResizer.lastResizeRowOldHeight) {
            this.rowResizer.commandManager.executeCommand(
                new ResizeRowCommand(this.gridMatrix, this.rowResizer.resizingRowIndex, this.rowResizer.lastResizeRowOldHeight, newHeight, this.rowResizer)
            );
        }
        this.setCursor("cell");
    }

    setCursor(cursor: string) {
        if (this.rowResizer.canvas.style.cursor !== cursor) {
            this.rowResizer.canvas.style.cursor = cursor;
        }
    }
}