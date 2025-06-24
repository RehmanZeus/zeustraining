import { SparseGridMatrix } from "./SparseGridMatrix";

export class GridViewport {
    scrollLeft: number = 0;
    scrollTop: number = 0;
    canvasWidth: number;
    canvasHeight: number;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    getVisibleRange(grid: SparseGridMatrix) {
        let y = 0, rowStart = 0;
        while (rowStart < grid.noOfRows && y + grid.rowHeights[rowStart] <= this.scrollTop) {
            y += grid.rowHeights[rowStart];
            rowStart++;
        }
        let x = 0, colStart = 0;
        while (colStart < grid.noOfCols && x + grid.columnWidths[colStart] <= this.scrollLeft) {
            x += grid.columnWidths[colStart];
            colStart++;
        }
        let rowEnd = rowStart, currY = y;
        while (rowEnd < grid.noOfRows && currY < this.scrollTop + this.canvasHeight) {
            currY += grid.rowHeights[rowEnd];
            rowEnd++;
        }
        let colEnd = colStart, currX = x;
        while (colEnd < grid.noOfCols && currX < this.scrollLeft + this.canvasWidth) {
            currX += grid.columnWidths[colEnd];
            colEnd++;
        }
        return { rowStart, rowEnd, colStart, colEnd };
    }
}