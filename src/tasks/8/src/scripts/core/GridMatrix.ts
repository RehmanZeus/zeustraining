import { MAX_GRID_COLS, MAX_GRID_ROWS, MIN_GRIDCELL_HEIGHT, MIN_GRIDCELL_WIDTH } from "../constants.js";
import { GridCell } from "./GridCell.js";

export class GridMatrix {
    noOfRows: number = MAX_GRID_ROWS;
    noOfCols: number = MAX_GRID_COLS;

    grid: Map<number, Map<number, GridCell>> = new Map();

    columnWidths: number[] = [];
    rowHeights: number[] = [];

    constructor(_c: CanvasRenderingContext2D, rows?: number, cols?: number) {
        this.noOfRows = rows ?? this.noOfRows;
        this.noOfCols = cols ?? this.noOfCols;
        this.columnWidths = Array(this.noOfCols).fill(MIN_GRIDCELL_WIDTH);
        this.rowHeights = Array(this.noOfRows).fill(MIN_GRIDCELL_HEIGHT);
        this.initializeGrid();
    }

    initializeGrid() {
        this.grid = new Map();
    }

    getCell(row: number, col: number): GridCell {
        if (!this.grid.has(row)) this.grid.set(row, new Map<number, GridCell>());
        const rowMap = this.grid.get(row)!;
        if (rowMap.has(col)) return rowMap.get(col)!;

        let data: string | undefined;
        if (row === 0 && col === 0) data = "";
        else if (row === 0) data = GridCell.generateHeader(col - 1);
        else if (col === 0) data = `${row}`;
        const id = `${row}:${col}`;
        const cell = new GridCell(id, data);
        rowMap.set(col, cell);
        return cell;
    }

    addMoreGrids(requiredRows: number, requiredCols: number) {
        // Add more rows if needed
        while (this.noOfRows < requiredRows) {
            this.rowHeights.push(MIN_GRIDCELL_HEIGHT);
            this.noOfRows++;
        }
        // Add more columns if needed
        while (this.noOfCols < requiredCols) {
            this.columnWidths.push(MIN_GRIDCELL_WIDTH);
            this.noOfCols++;
        }
    }

    // Helper to get cumulative offset for a row/col
    getRowOffset(row: number): number {
        let sum = 0;
        for (let i = 0; i < row; ++i) sum += this.rowHeights[i];
        return sum;
    }
    getColOffset(col: number): number {
        let sum = 0;
        for (let i = 0; i < col; ++i) sum += this.columnWidths[i];
        return sum;
    }

    getViewportBounds(
        scrollLeft: number,
        scrollTop: number,
        viewportWidth: number,
        viewportHeight: number
    ): { startRow: number; endRow: number; startCol: number; endCol: number } {
        let y = 0, startRow = 0, endRow = this.noOfRows;
        for (let r = 0; r < this.noOfRows; r++) {
            const rowHeight = this.rowHeights[r];
            if (y + rowHeight > scrollTop && startRow === 0) startRow = r;
            if (y > scrollTop + viewportHeight) { endRow = r; break; }
            y += rowHeight;
        }
        let x = 0, startCol = 0, endCol = this.noOfCols;
        for (let c = 0; c < this.noOfCols; c++) {
            const colWidth = this.columnWidths[c];
            if (x + colWidth > scrollLeft && startCol === 0) startCol = c;
            if (x > scrollLeft + viewportWidth) { endCol = c; break; }
            x += colWidth;
        }
        startRow = Math.max(0, startRow - 1);
        startCol = Math.max(0, startCol - 1);
        return { startRow, endRow, startCol, endCol };
    }

    /**
     * Draw the grid using lines for cell borders, and render text for headers/data only.
     */
    drawGrid(
        ctx: CanvasRenderingContext2D,
        viewport?: { startRow: number, endRow: number, startCol: number, endCol: number },
        scrollLeft: number = 0, scrollTop: number = 0
    ) {
        ctx.save();

        const offsetX = scrollLeft || 0;
        const offsetY = scrollTop || 0;

        const startRow = viewport?.startRow ?? 0;
        const endRow = viewport?.endRow ?? this.noOfRows;
        const startCol = viewport?.startCol ?? 0;
        const endCol = viewport?.endCol ?? this.noOfCols;

        // Compute cumulative offsets for grid lines
        let rowOffsets: number[] = [0];
        for (let r = 0; r < this.noOfRows; ++r) rowOffsets[r+1] = rowOffsets[r] + this.rowHeights[r];
        let colOffsets: number[] = [0];
        for (let c = 0; c < this.noOfCols; ++c) colOffsets[c+1] = colOffsets[c] + this.columnWidths[c];

        // Draw vertical grid lines
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 1;
        for (let c = startCol; c <= endCol; ++c) {
            let x = colOffsets[c] - offsetX;
            ctx.beginPath();
            ctx.moveTo(x, rowOffsets[startRow] - offsetY);
            ctx.lineTo(x, rowOffsets[endRow] - offsetY);
            ctx.stroke();
        }
        // Draw horizontal grid lines
        for (let r = startRow; r <= endRow; ++r) {
            let y = rowOffsets[r] - offsetY;
            ctx.beginPath();
            ctx.moveTo(colOffsets[startCol] - offsetX, y);
            ctx.lineTo(colOffsets[endCol] - offsetX, y);
            ctx.stroke();
        }

        // Draw cell data (headers and data cells)
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let row = startRow; row < endRow; ++row) {
            for (let col = startCol; col < endCol; ++col) {
                // compute visible cell rectangle
                const x = colOffsets[col] - offsetX;
                const y = rowOffsets[row] - offsetY;
                const width = this.columnWidths[col];
                const height = this.rowHeights[row];

                // Render cell data if present
                const cell = this.getCell(row, col);
                if (cell.data) {
                    ctx.fillStyle = (row === 0 || col === 0) ? "#616161" : "#000";
                    ctx.fillText(
                        cell.data,
                        x + width / 2,
                        y + height / 2
                    );
                }
            }
        }
        ctx.restore();
    }
}