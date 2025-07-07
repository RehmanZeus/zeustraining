import { GridMatrix } from "../core/GridMatrix";

export class DrawingHelper {

    gridMatrix: GridMatrix;

    /**
     * Constructor for DrawingHelper helps in setting up the environment for helping
     * @param gm Instance of the gridMatrix class
     */
    constructor(gm: GridMatrix) {
        this.gridMatrix = gm;
    }

    /**
     * Ensures the row header is wide enough for its largest label.
     * Call this before drawing the grid, or whenever the row header text can change.
     * @param ctx 2d Context of the respective Canvas
     */
    updateRowHeaderWidth(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.font = "14px Arial";
        let maxWidth = 0;

        // Check all header cells in the first column (row headers)
        for (let row = 1; row < this.gridMatrix.noOfRows; ++row) {
            const cell = this.gridMatrix.getCell(row, 0);
            let label = cell.data ? cell.data.toString() : row.toString();
            const metrics = ctx.measureText(label);
            maxWidth = Math.max(maxWidth, metrics.width);
        }

        // Optionally check the corner cell (0,0)
        const cornerCell = this.gridMatrix.getCell(0, 0);
        if (cornerCell.data) {
            maxWidth = Math.max(maxWidth, ctx.measureText(cornerCell.data.toString()).width);
        }

        ctx.restore();

        // Add padding and minimum width
        const padding = 20;
        const minWidth = 40;
        let width = Math.ceil(maxWidth + padding);
        width = Math.max(width, minWidth);

        // Optional: Smoother growth for very large numbers
        if (width > 100) width = 100 + Math.log(width - 99) * 40;

        // Set the width for the row header column (col 0)
        this.gridMatrix.columnWidths[0] = width;
    }


    /**
     * Gets the bounds of the visible viewport in the grid.
     * @param scrollLeft The horizontal scroll position.
     * @param scrollTop The vertical scroll position.
     * @param viewportWidth The width of the viewport.
     * @param viewportHeight The height of the viewport.
     * @returns An object containing the start and end row/column indices.
     */
    getViewportBounds(
        scrollLeft: number,
        scrollTop: number,
        viewportWidth: number,
        viewportHeight: number
    ): { startRow: number; endRow: number; startCol: number; endCol: number } {
        let y = 0, startRow = 0, endRow = this.gridMatrix.noOfRows;
        for (let r = 0; r < this.gridMatrix.noOfRows; r++) {
            const rowHeight = this.gridMatrix.rowHeights[r];
            if (y + rowHeight > scrollTop && startRow === 0) startRow = r;
            if (y > scrollTop + viewportHeight) { endRow = r; break; }
            y += rowHeight;
        }
        let x = 0, startCol = 0, endCol = this.gridMatrix.noOfCols;
        for (let c = 0; c < this.gridMatrix.noOfCols; c++) {
            const colWidth = this.gridMatrix.columnWidths[c];
            if (x + colWidth > scrollLeft && startCol === 0) startCol = c;
            if (x > scrollLeft + viewportWidth) { endCol = c; break; }
            x += colWidth;
        }
        startRow = Math.max(0, startRow - 1);
        startCol = Math.max(0, startCol - 1);
        return { startRow, endRow, startCol, endCol };
    }


    /**
     * Converts a column letter (like "A" or "AB") to a 1-based column index.
     * @param col The column letters.
     */
    colLetterToIndex(col: string): number {
        let idx = 0;
        col = col.toUpperCase();
        for (let i = 0; i < col.length; i++) {
            idx = idx * 26 + (col.charCodeAt(i) - 64);
        }
        return idx;
    }


    /**
     * Gets the vertical offset position of a specific row.
     * @param row The row index (zero-based).
     * @returns The vertical offset in pixels.
     */
    getRowOffset(row: number): number {
        let sum = 0;
        for (let i = 0; i < row; ++i) sum += this.gridMatrix.rowHeights[i];
        return sum;
    }

    /**
     * Gets the horizontal offset position of a specific column.
     * @param col The column index (zero-based).
     * @returns The horizontal offset in pixels.
     */
    getColOffset(col: number): number {
        let sum = 0;
        for (let i = 0; i < col; ++i) sum += this.gridMatrix.columnWidths[i];
        return sum;
    }

    

}