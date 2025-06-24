import { MAX_GRID_COLS, MAX_GRID_ROWS, MIN_GRIDCELL_HEIGHT, MIN_GRIDCELL_WIDTH } from "../constants.js";
import { GridCell } from "./GridCell.js";

/**
 * SparseGridMatrix is responsible for managing a 2D grid structure of cells
 * in a memory-efficient way, suitable for very large grids (100,000+ rows and 500+ columns).
 */
export class GridMatrix {
    /** Total number of rows in the grid */
    noOfRows: number = MAX_GRID_ROWS;

    /** Total number of columns in the grid */
    noOfCols: number = MAX_GRID_COLS;

    /**
     * Sparse representation of the grid using a Map of Maps:
     * - Top-level Map key: row index (number)
     * - Nested Map key: column index (number)
     * - Value: GridCell instance
     * Only instantiated cells with data are stored.
     */
    grid: Map<number, Map<number, GridCell>> = new Map();

    /** Canvas rendering context used for drawing the grid */
    c: CanvasRenderingContext2D;

    /** Dynamic widths for each column, allowing for resizing */
    columnWidths: number[] = [];

    /** Dynamic heights for each row, allowing for resizing */
    rowHeights: number[] = [];

    /** Precomputed column offsets (x positions) */
    colOffsets: number[] = [];

    /** Precomputed row offsets (y positions) */
    rowOffsets: number[] = [];

    constructor(c: CanvasRenderingContext2D, rows?: number, cols?: number) {
        this.noOfRows = rows ?? this.noOfRows;
        this.noOfCols = cols ?? this.noOfCols;
        this.c = c;

        // Initialize default dimensions
        this.columnWidths = Array(this.noOfCols).fill(MIN_GRIDCELL_WIDTH);
        this.rowHeights = Array(this.noOfRows).fill(MIN_GRIDCELL_HEIGHT);

        this.computeOffsets();
        this.initializeHeaders();
    }

    /**
     * Precompute row and column offsets for fast cell position lookup.
     * Call whenever rowHeights or columnWidths change.
     */
    computeOffsets() {
        this.rowOffsets = [0];
        for (let r = 1; r < this.noOfRows; r++) {
            this.rowOffsets[r] = this.rowOffsets[r - 1] + this.rowHeights[r - 1];
        }
        this.colOffsets = [0];
        for (let c = 1; c < this.noOfCols; c++) {
            this.colOffsets[c] = this.colOffsets[c - 1] + this.columnWidths[c - 1];
        }
    }

    /**
     * Initializes only header cells—row headers (col 0) and column headers (row 0)—for memory efficiency.
     */
    initializeHeaders() {
        this.grid = new Map();
        // Row headers
        for (let row = 0; row < this.noOfRows; row++) {
            let rowMap = new Map<number, GridCell>();
            const x = 0;
            const y = this.rowOffsets[row];
            const width = this.columnWidths[0];
            const height = this.rowHeights[row];
            const header = GridCell.generateHeader(-1);
            const id = `${row}${header}`;
            const data = row === 0 ? "" : `${row}`;
            rowMap.set(0, new GridCell(id, x, y, this.c, width, height, data));
            this.grid.set(row, rowMap);
        }
        // Column headers
        if (this.grid.has(0)) {
            let rowMap = this.grid.get(0)!;
            for (let col = 1; col < this.noOfCols; col++) {
                const x = this.colOffsets[col];
                const y = 0;
                const width = this.columnWidths[col];
                const height = this.rowHeights[0];
                const header = GridCell.generateHeader(col - 1);
                const id = `0${header}`;
                const data = header;
                rowMap.set(col, new GridCell(id, x, y, this.c, width, height, data));
            }
        }
    }

    /**
     * Gets the cell with data at (row, col), or undefined if none.
     * (Used for data cells, not headers)
     */
    getDataCell(row: number, col: number): GridCell | undefined {
        return this.grid.get(row)?.get(col);
    }

    /**
     * Sets or updates data in a cell at (row, col).
     * Only stores cells that actually have data.
     */
    setCellData(row: number, col: number, value: string) {
        if (row === 0 || col === 0) return; // Don't allow edits to headers
        let rowMap = this.grid.get(row);
        if (!rowMap) {
            rowMap = new Map<number, GridCell>();
            this.grid.set(row, rowMap);
        }
        const x = this.colOffsets[col];
        const y = this.rowOffsets[row];
        const width = this.columnWidths[col];
        const height = this.rowHeights[row];
        const id = `${row}${GridCell.generateHeader(col - 1)}`;
        rowMap.set(col, new GridCell(id, x, y, this.c, width, height, value));
    }

    /**
     * Gets header or data cell if it exists, otherwise returns undefined.
     */
    getCell(row: number, col: number): GridCell | undefined {
        if (row === 0 || col === 0) {
            return this.grid.get(row)?.get(col);
        }
        return this.grid.get(row)?.get(col);
    }

    /**
     * Gets the data at (row, col) if present, otherwise returns undefined.
     */
    getCellData(row: number, col: number): string | undefined {
        return this.grid.get(row)?.get(col)?.data;
    }

    /**
     * Adds more rows or columns if required.
     * Updates offsets and headers appropriately.
     */
    addMoreGrids(requiredRows: number, requiredCols: number) {
        let added = false;
        // Add rows
        while (this.noOfRows < requiredRows) {
            const row = this.noOfRows;
            this.rowHeights.push(MIN_GRIDCELL_HEIGHT);
            const x = 0;
            const y = this.rowOffsets.length > 0 ? this.rowOffsets[this.rowOffsets.length - 1] + this.rowHeights[row - 1] : 0;
            const width = this.columnWidths[0];
            const height = MIN_GRIDCELL_HEIGHT;
            const header = GridCell.generateHeader(-1);
            const id = `${row}${header}`;
            const data = `${row}`;
            const rowMap = new Map<number, GridCell>();
            rowMap.set(0, new GridCell(id, x, y, this.c, width, height, data));
            this.grid.set(row, rowMap);
            this.noOfRows++;
            added = true;
        }
        // Add columns
        while (this.noOfCols < requiredCols) {
            this.columnWidths.push(MIN_GRIDCELL_WIDTH);
            const col = this.noOfCols;
            const x = this.colOffsets.length > 0 ? this.colOffsets[this.colOffsets.length - 1] + this.columnWidths[col - 1] : 0;
            const y = 0;
            const width = MIN_GRIDCELL_WIDTH;
            const height = this.rowHeights[0];
            const header = GridCell.generateHeader(col - 1);
            const id = `0${header}`;
            const data = header;
            if (!this.grid.has(0)) this.grid.set(0, new Map());
            const rowMap = this.grid.get(0)!;
            rowMap.set(col, new GridCell(id, x, y, this.c, width, height, data));
            this.noOfCols++;
            added = true;
        }
        if (added) this.computeOffsets();
    }

    /**
     * Updates all offsets and header cell positions/sizes after a resize.
     * Call this after changing columnWidths or rowHeights.
     */
    recalculateLayout() {
        this.computeOffsets();
        // Update header cell positions/sizes
        for (let row = 0; row < this.noOfRows; row++) {
            let rowMap = this.grid.get(row);
            if (rowMap && rowMap.has(0)) {
                let cell = rowMap.get(0)!;
                cell.x = 0;
                cell.y = this.rowOffsets[row];
                cell.width = this.columnWidths[0];
                cell.height = this.rowHeights[row];
            }
        }
        if (this.grid.has(0)) {
            let rowMap = this.grid.get(0)!;
            for (let col = 1; col < this.noOfCols; col++) {
                if (rowMap.has(col)) {
                    let cell = rowMap.get(col)!;
                    cell.x = this.colOffsets[col];
                    cell.y = 0;
                    cell.width = this.columnWidths[col];
                    cell.height = this.rowHeights[0];
                }
            }
        }
    }

    /**
     * Returns the viewport bounds (start/end rows and cols) for efficient rendering.
     */
    getViewportBounds(
        scrollLeft: number,
        scrollTop: number,
        viewportWidth: number,
        viewportHeight: number
    ): { startRow: number; endRow: number; startCol: number; endCol: number } {
        // Find first and last visible row/col using precomputed offsets
        let startRow = 0, endRow = this.noOfRows;
        let startCol = 0, endCol = this.noOfCols;
        // Row bounds
        for (let r = 0; r < this.noOfRows; r++) {
            if (this.rowOffsets[r] + this.rowHeights[r] > scrollTop) { startRow = r; break; }
        }
        for (let r = startRow; r < this.noOfRows; r++) {
            if (this.rowOffsets[r] > scrollTop + viewportHeight) { endRow = r; break; }
        }
        // Col bounds
        for (let c = 0; c < this.noOfCols; c++) {
            if (this.colOffsets[c] + this.columnWidths[c] > scrollLeft) { startCol = c; break; }
        }
        for (let c = startCol; c < this.noOfCols; c++) {
            if (this.colOffsets[c] > scrollLeft + viewportWidth) { endCol = c; break; }
        }
        // Always draw headers
        startRow = Math.max(0, startRow - 1);
        startCol = Math.max(0, startCol - 1);
        return { startRow, endRow, startCol, endCol };
    }

    /**
     * Efficiently renders only the visible part of the grid.
     * Fetches cell data where it exists, otherwise just draws an empty cell.
     */
    drawGrid(ctx: CanvasRenderingContext2D, viewport?: { startRow: number, endRow: number, startCol: number, endCol: number }) {
        ctx.save();

        const startRow = viewport?.startRow ?? 0;
        const endRow = viewport?.endRow ?? this.noOfRows;
        const startCol = viewport?.startCol ?? 0;
        const endCol = viewport?.endCol ?? this.noOfCols;

        ctx.font = "14px Arial";
        ctx.textBaseline = "middle";

        // Draw column headers
        for (let col = startCol; col < endCol; col++) {
            const x = this.colOffsets[col];
            const y = 0;
            const width = this.columnWidths[col];
            const height = this.rowHeights[0];
            ctx.fillStyle = "#f5f5f5";
            ctx.fillRect(x, y, width, height);
            const cell = this.getCell(0, col);
            if (cell?.data) {
                ctx.fillStyle = "#616161";
                ctx.textAlign = "center";
                ctx.fillText(cell.data, x + width / 2, y + height / 2);
            }
        }

        // Draw row headers
        for (let row = startRow; row < endRow; row++) {
            const x = 0;
            const y = this.rowOffsets[row];
            const width = this.columnWidths[0];
            const height = this.rowHeights[row];
            ctx.fillStyle = "#f5f5f5";
            ctx.fillRect(x, y, width, height);
            const cell = this.getCell(row, 0);
            if (cell?.data) {
                ctx.fillStyle = "#616161";
                ctx.textAlign = "right";
                ctx.fillText(cell.data, x + width - 8, y + height / 2);
            }
        }

        // Draw cells (skip headers)
        for (let row = startRow; row < endRow; row++) {
            const y = this.rowOffsets[row];
            const height = this.rowHeights[row];
            for (let col = startCol; col < endCol; col++) {
                const x = this.colOffsets[col];
                const width = this.columnWidths[col];

                // Draw border for all cells
                ctx.strokeStyle = "#e0e0e0";
                ctx.lineWidth = 1;
                ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, width, height);

                // Skip already drawn header text
                if (row === 0 || col === 0) continue;

                // Draw cell data if present
                const cell = this.getDataCell(row, col);
                if (cell?.data) {
                    let text = cell.data;
                    const ellipsis = "...";
                    const maxWidth = width - 10;

                    if (ctx.measureText(text).width > maxWidth) {
                        let truncatedText = text;
                        while (ctx.measureText(truncatedText + ellipsis).width > maxWidth && truncatedText.length > 0) {
                            truncatedText = truncatedText.slice(0, -1);
                        }
                        text = truncatedText + ellipsis;
                    }

                    ctx.fillStyle = "#000";
                    ctx.textAlign = "center";
                    ctx.fillText(text, x + width / 2, y + height / 2);
                }
            }
        }
        ctx.restore();
    }

}