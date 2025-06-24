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
     * Only instantiated cells are stored; others are generated on demand.
     */
    grid: Map<number, Map<number, GridCell>> = new Map();

    /** Canvas rendering context used for drawing the grid */
    c: CanvasRenderingContext2D;

    /** Dynamic widths for each column, allowing for resizing */
    columnWidths: number[] = [];

    /** Dynamic heights for each row, allowing for resizing */
    rowHeights: number[] = [];

    /**
     * Constructs a GridMatrix instance with optional row and column counts.
     * Initializes default dimensions and builds the initial grid layout.
     * 
     * @param c - Canvas 2D rendering context
     * @param rows - Optional number of rows to initialize
     * @param cols - Optional number of columns to initialize
     */
    constructor(c: CanvasRenderingContext2D, rows?: number, cols?: number) {
        this.noOfRows = rows ?? this.noOfRows;
        this.noOfCols = cols ?? this.noOfCols;
        this.c = c;

        // Initialize default dimensions for all columns and rows
        this.columnWidths = Array(this.noOfCols).fill(MIN_GRIDCELL_WIDTH);
        this.rowHeights = Array(this.noOfRows).fill(MIN_GRIDCELL_HEIGHT);

        this.initializeGrid();
    }

    /**
     * Initializes the grid structure by creating GridCell instances
     * for each row and column header, and assigning appropriate positions and sizes.
     * Only header cells are eagerly created; others are generated on demand.
     */
    initializeGrid() {
        this.grid = new Map();

        // Only create header cells at initialization for efficiency
        for (let row = 0; row < this.noOfRows; row++) {
            let rowMap = new Map<number, GridCell>();
            // Row header cell
            let y = this.rowHeights.slice(0, row).reduce((a, b) => a + b, 0);
            let x = 0;
            let width = this.columnWidths[0];
            let height = this.rowHeights[row];
            let header = GridCell.generateHeader(-1);
            let id = `${row}${header}`;
            let data = row === 0 ? "" : `${row}`;
            rowMap.set(0, new GridCell(id, x, y, this.c, width, height, data));
            this.grid.set(row, rowMap);
        }
        // Column header cells
        if (this.grid.has(0)) {
            for (let col = 1; col < this.noOfCols; col++) {
                let rowMap = this.grid.get(0)!;
                let y = 0;
                let x = this.columnWidths.slice(0, col).reduce((a, b) => a + b, 0);
                let width = this.columnWidths[col];
                let height = this.rowHeights[0];
                let header = GridCell.generateHeader(col - 1);
                let id = `0${header}`;
                let data = header;
                rowMap.set(col, new GridCell(id, x, y, this.c, width, height, data));
            }
        }
    }

    logStats() {
        let headerCellCount = 0;
        let dataCellCount = 0;

        for (const [row, rowMap] of this.grid.entries()) {
            for (const [col, cell] of rowMap.entries()) {
                if (row === 0 || col === 0) headerCellCount++;
                else dataCellCount++;
            }
        }

        const totalCells = headerCellCount + dataCellCount;
        // Estimate: Each GridCell ~ 120 bytes (ID string, numbers, data, object overhead)
        const bytesPerCell = 120;
        const totalBytes = totalCells * bytesPerCell;
        const mbUsed = totalBytes / (1024 * 1024);

        console.log("=== GridMatrix Stats ===");
        console.log(`Rows: ${this.noOfRows}`);
        console.log(`Cols: ${this.noOfCols}`);
        console.log(`Header cells: ${headerCellCount}`);
        console.log(`Data cells: ${dataCellCount}`);
        console.log(`Total GridCell objects: ${totalCells}`);
        console.log(`Estimated memory used: ${mbUsed.toFixed(2)} MB`);
        console.log("=======================");
    }
    /**
     * Gets (or creates if missing) a cell at the given row and column.
     * @param row Row index
     * @param col Column index
     */
    getCell(row: number, col: number): GridCell {
        // If row does not exist, initialize
        if (!this.grid.has(row)) {
            this.grid.set(row, new Map<number, GridCell>());
        }
        const rowMap = this.grid.get(row)!;
        if (rowMap.has(col)) {
            return rowMap.get(col)!;
        }
        // Calculate positions and sizes
        const y = this.rowHeights.slice(0, row).reduce((a, b) => a + b, 0);
        const x = this.columnWidths.slice(0, col).reduce((a, b) => a + b, 0);
        const width = this.columnWidths[col];
        const height = this.rowHeights[row];
        const header = GridCell.generateHeader(col - 1);
        const id = `${row}${header}`;
        let data: string | undefined;
        if (row === 0 && col === 0) data = "";
        else if (row === 0) data = header;
        else if (col === 0) data = `${row}`;
        // Otherwise, leave data undefined or as previously set
        const cell = new GridCell(id, x, y, this.c, width, height, data);
        rowMap.set(col, cell);
        return cell;
    }

    /**
     * Adds more rows or columns if required.
     * @param requiredRows Number of required rows
     * @param requiredCols Number of required columns
     */
    addMoreGrids(requiredRows: number, requiredCols: number) {
        // Add more rows if needed
        while (this.noOfRows < requiredRows) {
            const row = this.noOfRows;
            this.rowHeights.push(MIN_GRIDCELL_HEIGHT);
            let rowMap = new Map<number, GridCell>();
            // Create only row header for sparse mode
            const y = this.rowHeights.slice(0, row).reduce((a, b) => a + b, 0);
            const x = 0;
            const width = this.columnWidths[0];
            const height = MIN_GRIDCELL_HEIGHT;
            const header = GridCell.generateHeader(-1);
            const id = `${row}${header}`;
            const data = `${row}`;
            rowMap.set(0, new GridCell(id, x, y, this.c, width, height, data));
            this.grid.set(row, rowMap);
            this.noOfRows++;
        }

        // Add more columns if needed (only update columnWidths and col headers)
        while (this.noOfCols < requiredCols) {
            this.columnWidths.push(MIN_GRIDCELL_WIDTH);
            // Add column header cell to row 0
            const col = this.noOfCols;
            if (!this.grid.has(0)) this.grid.set(0, new Map());
            const rowMap = this.grid.get(0)!;
            const y = 0;
            const x = this.columnWidths.slice(0, col).reduce((a, b) => a + b, 0);
            const width = MIN_GRIDCELL_WIDTH;
            const height = this.rowHeights[0];
            const header = GridCell.generateHeader(col - 1);
            const id = `0${header}`;
            const data = header;
            rowMap.set(col, new GridCell(id, x, y, this.c, width, height, data));
            this.noOfCols++;
        }
    }


    // Add this helper in GridMatrix
    getViewportBounds(
        scrollLeft: number,
        scrollTop: number,
        viewportWidth: number,
        viewportHeight: number
    ): { startRow: number; endRow: number; startCol: number; endCol: number } {
        // Find first and last visible row/col based on cumulative heights/widths
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
        // Always draw row/col 0 (headers)
        startRow = Math.max(0, startRow - 1);
        startCol = Math.max(0, startCol - 1);
        return { startRow, endRow, startCol, endCol };
    }




    /**
     * Renders the entire grid onto the canvas, including cell borders and labels.
     * Only visible cells are fetched/generated for performance.
     * 
     * @param ctx - Canvas 2D rendering context
     * @param viewport Optional: {startRow, endRow, startCol, endCol} to render only visible cells
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

        // 1. Draw all grid cells except headers
        for (let rowIndex = startRow; rowIndex < endRow; rowIndex++) {
            for (let colIndex = startCol; colIndex < endCol; colIndex++) {
                // Skip headers for now
                if (rowIndex === 0 || colIndex === 0) continue;
                const cell = this.getCell(rowIndex, colIndex);
                ctx.strokeStyle = "#e0e0e0";
                ctx.lineWidth = 1;
                ctx.strokeRect(
                    Math.floor(cell.x - offsetX) + 0.5,
                    Math.floor(cell.y - offsetY) + 0.5,
                    cell.width,
                    cell.height
                );
                if (cell.data) {
                    ctx.font = "14px Arial";
                    ctx.fillStyle = "#000";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(
                        cell.data,
                        cell.x - offsetX + cell.width / 2,
                        cell.y - offsetY + cell.height / 2
                    );
                }
            }
        }

        // 2. Draw column headers (row 0, all visible cols)
        for (let col = startCol; col < endCol; col++) {
            const cell = this.getCell(0, col);
            ctx.fillStyle = "#f5f5f5";
            // Only shift horizontally (sticky top)
            ctx.fillRect(cell.x - offsetX, cell.y, cell.width, cell.height);

            ctx.strokeStyle = "#e0e0e0";
            ctx.lineWidth = 1;
            ctx.strokeRect(
                Math.floor(cell.x - offsetX) + 0.5,
                Math.floor(cell.y) + 0.5,
                cell.width,
                cell.height
            );

            if (cell.data) {
                ctx.font = "14px Arial";
                ctx.fillStyle = "#616161";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(
                    cell.data,
                    cell.x - offsetX + cell.width / 2,
                    cell.y + cell.height / 2
                );
            }
        }

        // 3. Draw row headers (col 0, all visible rows)
        for (let row = startRow; row < endRow; row++) {
            const cell = this.getCell(row, 0);
            ctx.fillStyle = "#f5f5f5";
            // Only shift vertically (sticky left)
            ctx.fillRect(cell.x, cell.y - offsetY, cell.width, cell.height);

            ctx.strokeStyle = "#e0e0e0";
            ctx.lineWidth = 1;
            ctx.strokeRect(
                Math.floor(cell.x) + 0.5,
                Math.floor(cell.y - offsetY) + 0.5,
                cell.width,
                cell.height
            );

            if (cell.data) {
                ctx.font = "14px Arial";
                ctx.fillStyle = "#616161";
                ctx.textAlign = "right";
                ctx.textBaseline = "bottom";
                ctx.fillText(
                    cell.data,
                    cell.x + cell.width - 8,
                    cell.y - offsetY + cell.height - 4
                );
            }
        }

        // 4. Draw sticky corner cell (0,0) last
        const cornerCell = this.getCell(0, 0);
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(cornerCell.x, cornerCell.y, cornerCell.width, cornerCell.height);
        ctx.strokeStyle = "#e0e0e0";
        ctx
    }
}