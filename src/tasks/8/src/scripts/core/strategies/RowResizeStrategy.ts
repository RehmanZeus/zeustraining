import { MIN_GRIDCELL_HEIGHT } from "../../constants.js";
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
        // Set the resizingRowIndex if near an edge, so it's available for preview
        return this.rowResizer.isNearRowEdge(e);
    }

    onPointerDown(e: PointerEvent): void {
        const { y } = this.rowResizer.getMousePositionForEdgeDetection(e);
        this.rowResizer.isResizingRow = true;
        this.rowResizer.startY = y;
        this.rowResizer.initialHeight = this.gridMatrix.rowHeights[this.rowResizer.resizingRowIndex];
        this.rowResizer.lastResizeRowOldHeight = this.rowResizer.initialHeight;
        e.preventDefault();
    }

    onPointerMove(e: PointerEvent): void {
        if (this.rowResizer.isResizingRow) {
            const { y } = this.rowResizer.getMousePositionForEdgeDetection(e);
            const delta = y - this.rowResizer.startY;
            const previewHeight = Math.max(MIN_GRIDCELL_HEIGHT, this.rowResizer.initialHeight + delta);
            this.rowResizer.previewRowHeight = previewHeight;
            this.rowResizer.previewDrawResizeRow(this.rowResizer.resizingRowIndex, previewHeight, this.rowResizer.initialHeight);
            e.preventDefault();
            return;
        } 
    }

    onPointerUp(e: PointerEvent): void {
        if (!this.rowResizer.isResizingRow) return;
        this.rowResizer.isResizingRow = false;
        const newHeight = this.rowResizer.previewRowHeight ?? this.gridMatrix.rowHeights[this.rowResizer.resizingRowIndex];
        if (
            this.rowResizer.lastResizeRowOldHeight !== null &&
            newHeight !== this.rowResizer.lastResizeRowOldHeight &&
            this.rowResizer.commandManager
        ) {
            this.rowResizer.commandManager.executeCommand(
                new ResizeRowCommand(
                    this.gridMatrix,
                    this.rowResizer.resizingRowIndex,
                    this.rowResizer.lastResizeRowOldHeight,
                    newHeight,
                    this.rowResizer
                )
            );
        }
        this.gridMatrix.rowHeights[this.rowResizer.resizingRowIndex] = newHeight;

        // Update prefix sums after resizing the row
        let cumHeight = 0;
        for (let i = 0; i < this.gridMatrix.rowHeights.length; i++) {
            cumHeight += this.gridMatrix.rowHeights[i];
            this.gridMatrix.prefixRowHeights[i] = cumHeight;
        }

        this.rowResizer.previewRowHeight = null;
    }

    getCursor(): string {
        return "ns-resize";
    }
}