import { MAX_GRID_COLS, MAX_GRID_ROWS, MIN_GRIDCELL_HEIGHT, MIN_GRIDCELL_WIDTH } from "../constants.js";

export class SparseGridMatrix {
    /** Total number of rows and columns (can be virtual/scrollable up to MAX_*) */
    noOfRows: number = MAX_GRID_ROWS;
    noOfCols: number = MAX_GRID_COLS;

    /** Sparse storage: only non-default (non-empty) cells are stored */
    cellData: Map<string, string> = new Map();

    /** Sizing for dynamic resizing */
    columnWidths: number[] = [];
    rowHeights: number[] = [];

    /** Canvas rendering context */
    c: CanvasRenderingContext2D;

    constructor(c: CanvasRenderingContext2D, rows?: number, cols?: number) {
        this.noOfRows = rows ?? this.noOfRows;
        this.noOfCols = cols ?? this.noOfCols;
        this.c = c;

        this.columnWidths = Array(this.noOfCols).fill(MIN_GRIDCELL_WIDTH);
        this.rowHeights = Array(this.noOfRows).fill(MIN_GRIDCELL_HEIGHT);
    }

    /** Helper to generate unique key for a cell */
    getCellKey(row: number, col: number): string {
        return `${row}:${col}`;
    }

    /** Set the value of a cell. Empty strings are treated as deletion (default/empty cell) */
    setCellData(row: number, col: number, value: string) {
        const key = this.getCellKey(row, col);
        if (!value) {
            this.cellData.delete(key);
        } else {
            this.cellData.set(key, value);
        }
    }

    /** Get the value of a cell (returns undefined for empty/default cells) */
    getCellData(row: number, col: number): string | undefined {
        return this.cellData.get(this.getCellKey(row, col));
    }

    /** Resize a column */
    setColumnWidth(col: number, width: number) {
        this.columnWidths[col] = width;
    }

    /** Resize a row */
    setRowHeight(row: number, height: number) {
        this.rowHeights[row] = height;
    }

    /**
     * Draws the visible grid onto the canvas, using viewport info.
     * @param ctx - Canvas context
     * @param rowStart - First visible row
     * @param rowEnd - Last visible row (inclusive or exclusive as needed)
     * @param colStart - First visible col
     * @param colEnd - Last visible col
     */
    drawGrid(ctx: CanvasRenderingContext2D, rowStart: number, rowEnd: number, colStart: number, colEnd: number) {
        ctx.save();
        // Calculate cumulative offsets for each row/col for fast lookup
        let y = 0;
        for (let row = rowStart; row < rowEnd; row++) {
            let x = 0;
            for (let col = colStart; col < colEnd; col++) {
                const width = this.columnWidths[col];
                const height = this.rowHeights[row];
                // Draw cell border
                ctx.strokeStyle = "#e0e0e0";
                ctx.lineWidth = 1;
                ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, width, height);

                // Header cells (first row or col)
                if (row === 0 && col === 0) {
                    // Top-left corner cell, usually empty
                } else if (row === 0) {
                    // Column header
                    ctx.fillStyle = "#f5f5f5";
                    ctx.fillRect(x, y, width, height);
                    ctx.font = "14px Arial";
                    ctx.fillStyle = "#616161";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(this.generateHeader(col - 1), x + width / 2, y + height / 2);
                } else if (col === 0) {
                    // Row header
                    ctx.fillStyle = "#f5f5f5";
                    ctx.fillRect(x, y, width, height);
                    ctx.font = "14px Arial";
                    ctx.fillStyle = "#616161";
                    ctx.textAlign = "right";
                    ctx.textBaseline = "bottom";
                    ctx.fillText(`${row}`, x + width - 8, y + height - 4);
                } else {
                    // Regular cell
                    const value = this.getCellData(row, col);
                    if (value) {
                        let text = value;
                        const ellipsis = "...";
                        const maxWidth = width - 10;
                        ctx.font = "14px Arial";
                        if (ctx.measureText(text).width > maxWidth) {
                            let truncatedText = text;
                            while (ctx.measureText(truncatedText + ellipsis).width > maxWidth && truncatedText.length > 0) {
                                truncatedText = truncatedText.slice(0, -1);
                            }
                            text = truncatedText + ellipsis;
                        }
                        ctx.fillStyle = "#000";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText(text, x + width / 2, y + height / 2);
                    }
                }

                x += width;
            }
            y += this.rowHeights[row];
        }
        ctx.restore();
    }

    /** Generates Excel-style column header (A, B, ..., AA, AB, etc.) */
    generateHeader(index: number): string {
        let header = "";
        while (index >= 0) {
            header = String.fromCharCode((index % 26) + 65) + header;
            index = Math.floor(index / 26) - 1;
        }
        return header;
    }
}