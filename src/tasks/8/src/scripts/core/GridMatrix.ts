import { MAX_GRID_COLS, MAX_GRID_ROWS, MIN_GRIDCELL_HEIGHT, MIN_GRIDCELL_WIDTH } from "../constants.js";
import { CellSelector } from "./CellSelector.js";
import { GridCell } from "./GridCell.js";


/**
 * GridMatrix represents a 2D grid of cells with dynamic row/column management.
 * It handles cell creation, resizing, and viewport calculations.
 */
export class GridMatrix {
    /** Default number of rows and columns in the grid */
    noOfRows: number = MAX_GRID_ROWS;
    /** Default number of columns in the grid */
    noOfCols: number = MAX_GRID_COLS;

    /** 2D Map to store GridCell objects, indexed by row and column */
    // Using Map for dynamic resizing and efficient access
    grid: Map<number, Map<number, GridCell>> = new Map();

    /** Widths of each column in pixels */
    columnWidths: number[] = [];
    /** Heights of each row in pixels */
    rowHeights: number[] = [];

    cellSelector: CellSelector | undefined;



    /**
     * Creates a new GridMatrix instance.
     * @param _c CanvasRenderingContext2D - Not used directly, but can be used for drawing.
     * @param rows Optional initial number of rows (default is MAX_GRID_ROWS).
     * @param cols Optional initial number of columns (default is MAX_GRID_COLS).
     */
    constructor(_c: CanvasRenderingContext2D, rows?: number, cols?: number) {
        this.noOfRows = rows ?? this.noOfRows;
        this.noOfCols = cols ?? this.noOfCols;
        this.columnWidths = Array(this.noOfCols).fill(MIN_GRIDCELL_WIDTH);
        this.rowHeights = Array(this.noOfRows).fill(MIN_GRIDCELL_HEIGHT);
        this.initializeGrid();
    }

    /**
     * Initializes the grid with empty cells.
     * This is called in the constructor to set up the initial grid state.
     */
    initializeGrid() {
        this.grid = new Map();
    }


    setCellSelector(c: CellSelector) {
        this.cellSelector = c;
    }
    /**
     * Gets a GridCell at the specified row and column.
     * If the cell does not exist, it creates a new one with default data.
     * @param row The row index (zero-based).
     * @param col The column index (zero-based).
     * @returns The GridCell at the specified position.
     */
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

    /**
     * Adds more rows and columns to the grid as needed.
     * @param requiredRows The total number of rows required.
     * @param requiredCols The total number of columns required.
     */
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

    /**
     * Evaluates the display value for a cell.
     * If the cell data starts with "=", it's parsed as a formula.
     * Otherwise, returns the cell's data.
     * @param cell The GridCell to evaluate.
     */
    evaluateCell(cell: GridCell): number | string | undefined {
        if (!cell.data || typeof cell.data !== "string" || !cell.data.startsWith("=")) return cell.data;
        try {
            return this.evaluateFormula(cell.data);
        } catch (e) {
            return "#ERROR";
        }
    }

    /**
     * Evaluates a formula string, e.g. "=AVERAGE(A1:A10)"
     * Currently supports SUM and AVERAGE with a single range argument.
     * @param formulaString The formula string (must start with "=").
     */
    evaluateFormula(formulaString: string): number | string {
        // Remove leading '='
        const expr = formulaString.slice(1).trim();
        console.log(formulaString)
        // Match function name and argument
        const match = expr.match(/^(\w+)\(([^)]+)\)$/);
        if (!match) return "#FORMULA!";
        const fn = match[1].toUpperCase();
        const arg = match[2];
        console.log(fn, "ARGS", arg)
        if (fn === "SUM" || fn === "AVERAGE") {
            const cells = this.getCellsForRange(arg);
            const nums = cells
                .map(cell => parseFloat(cell.data ?? ""))
                .filter(n => !isNaN(n));
            if (fn === "SUM") return nums.reduce((a, b) => a + b, 0);
            if (fn === "AVERAGE") return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
        }

        //Find the minimum value in the range
        if (fn === "MIN") {
            const cells = this.getCellsForRange(arg);
            const nums = cells
                .map(cell => parseFloat(cell.data ?? ""))
                .filter(n => !isNaN(n));
            console.log(nums)
            return nums.length ? Math.min(...nums) : "#N/A";
        }

        //Find the maximum value in the range
        if (fn === "MAX") {
            const cells = this.getCellsForRange(arg);
            const nums = cells
                .map(cell => parseFloat(cell.data ?? ""))
                .filter(n => !isNaN(n));
            return nums.length ? Math.max(...nums) : "#N/A";
        }

        //Find the count of all cells in the range
        if (fn === "COUNT") {
            const cells = this.getCellsForRange(arg);
            return cells.length;
        }

        return "#N/A";
    }

    /**
     * Parses a range notation like "A1:B10" and returns all GridCell objects in that range.
     * @param rangeStr The range string in A1:B10 notation.
     */
    getCellsForRange(rangeStr: string): GridCell[] {
        const match = rangeStr.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
        console.log(match);
        if (!match) return [];
        const [, colA, rowA, colB, rowB] = match;
        const rowStart = Math.min(parseInt(rowA, 10), parseInt(rowB, 10));
        const rowEnd = Math.max(parseInt(rowA, 10), parseInt(rowB, 10));
        const colStart = Math.min(this.colLetterToIndex(colA), this.colLetterToIndex(colB));
        const colEnd = Math.max(this.colLetterToIndex(colA), this.colLetterToIndex(colB));
        const cells: GridCell[] = [];
        for (let row = rowStart; row <= rowEnd; row++) {
            for (let col = colStart; col <= colEnd; col++) {
                if (row >= 1 && col >= 1 && row < this.noOfRows && col < this.noOfCols) {
                    cells.push(this.getCell(row, col));
                }
            }
        }
        return cells;
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
        for (let i = 0; i < row; ++i) sum += this.rowHeights[i];
        return sum;
    }

    /**
     * Gets the horizontal offset position of a specific column.
     * @param col The column index (zero-based).
     * @returns The horizontal offset in pixels.
     */
    getColOffset(col: number): number {
        let sum = 0;
        for (let i = 0; i < col; ++i) sum += this.columnWidths[i];
        return sum;
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
     * Ensures the row header is wide enough for its largest label.
     * Call this before drawing the grid, or whenever the row header text can change.
     */
    updateRowHeaderWidth(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.font = "14px Arial";
        let maxWidth = 0;

        // Check all header cells in the first column (row headers)
        for (let row = 1; row < this.noOfRows; ++row) {
            const cell = this.getCell(row, 0);
            let label = cell.data ? cell.data.toString() : row.toString();
            const metrics = ctx.measureText(label);
            maxWidth = Math.max(maxWidth, metrics.width);
        }

        // Optionally check the corner cell (0,0)
        const cornerCell = this.getCell(0, 0);
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
        // if (width > 100) width = 100 + Math.log(width - 99) * 40;

        // Set the width for the row header column (col 0)
        this.columnWidths[0] = width;
    }


    // ... other imports and code
    /**
     * Draws the grid on the specified canvas context.
     * Supports header-only preview resizing (Excel-like behavior).
     * @param ctx CanvasRenderingContext2D - The context to draw on.
     * @param viewport The visible area of the grid.
     * @param scrollLeft The horizontal scroll position.
     * @param scrollTop The vertical scroll position.
     * @param previewColIndex (optional) If set, use previewColWidth only for the header cell at this column.
     * @param previewColWidth (optional) The temporary width to use for the header cell at previewColIndex.
     */
    drawGrid(
        ctx: CanvasRenderingContext2D,
        viewport?: { startRow: number, endRow: number, startCol: number, endCol: number },
        scrollLeft: number = 0, scrollTop: number = 0,
        previewColIndex?: number, previewColWidth?: number
    ) {
        this.updateRowHeaderWidth(ctx);
        ctx.save();

        const startRow = viewport?.startRow ?? 0;
        const endRow = viewport?.endRow ?? this.noOfRows;
        const startCol = viewport?.startCol ?? 0;
        const endCol = viewport?.endCol ?? this.noOfCols;

        // Compute cumulative offsets for grid lines
        let rowOffsets: number[] = [0];
        for (let r = 0; r < this.noOfRows; ++r) rowOffsets[r + 1] = rowOffsets[r] + this.rowHeights[r];

        // --- 1. Compute separate colOffsets for header and data ---
        let colOffsetsHeader: number[] = [0];
        let colOffsetsData: number[] = [0];
        for (let c = 0; c < this.noOfCols; ++c) {
            // For header row, preview width if previewColIndex
            let headerW = this.columnWidths[c];
            if (previewColIndex !== undefined && previewColWidth !== undefined && c === previewColIndex) {
                headerW = previewColWidth;
            }
            colOffsetsHeader[c + 1] = colOffsetsHeader[c] + headerW;
            // For data, always use original width
            colOffsetsData[c + 1] = colOffsetsData[c] + this.columnWidths[c];
        }

        // --- 2. Draw DATA GRID LINES (excluding headers) ---
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 1;

        // Vertical lines for data area
        for (let c = Math.max(1, startCol); c <= endCol; ++c) {
            let x = colOffsetsData[c] - scrollLeft;
            ctx.beginPath();
            ctx.moveTo(x, Math.max(this.rowHeights[0], rowOffsets[Math.max(1, startRow)] - scrollTop));
            ctx.lineTo(x, rowOffsets[endRow] - scrollTop);
            ctx.stroke();
        }
        // Horizontal lines for data area
        for (let r = Math.max(1, startRow); r <= endRow; ++r) {
            let y = rowOffsets[r] - scrollTop;
            ctx.beginPath();
            ctx.moveTo(Math.max(this.columnWidths[0], colOffsetsData[Math.max(1, startCol)] - scrollLeft), y);
            ctx.lineTo(colOffsetsData[endCol] - scrollLeft, y);
            ctx.stroke();
        }

        // --- 3. Draw DATA CELLS (excluding headers) ---
        ctx.font = "14px Arial";
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let row = Math.max(1, startRow); row < endRow; ++row) {
            for (let col = Math.max(1, startCol); col < endCol; ++col) {
                const x = colOffsetsData[col] - scrollLeft;
                const y = rowOffsets[row] - scrollTop;
                const width = this.columnWidths[col];
                const height = this.rowHeights[row];

                const cell = this.getCell(row, col);
                const displayValue = this.evaluateCell(cell);

                if (displayValue !== undefined && displayValue !== "") {
                    ctx.fillText(
                        typeof displayValue === "number"
                            ? displayValue.toLocaleString(undefined, { maximumFractionDigits: 6 })
                            : displayValue,
                        x + width / 2,
                        y + height / 2
                    );
                } else if (cell.data) {
                    ctx.fillText(cell.data, x + width / 2, y + height / 2);
                }
            }
        }

        // --- 4. Draw COLUMN HEADERS (row 0) ---
        for (let col = startCol; col < endCol; ++col) {
            const x = colOffsetsHeader[col] - scrollLeft;
            const y = 0;
            // Use preview width for header if this is the preview column
            const width = (previewColIndex !== undefined && previewColWidth !== undefined && col === previewColIndex)
                ? previewColWidth
                : this.columnWidths[col];
            const height = this.rowHeights[0];
            const selectedCol = this.cellSelector?.selectedCol;

            // Background
            ctx.fillStyle = selectedCol === col ? "#caead8" : "#f5f5f5";
            ctx.fillRect(x, y, width, height);

            // Border
            ctx.strokeStyle = "#e0e0e0";
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, width, height);

            // Thick green border for selected
            if (selectedCol === col) {
                ctx.save();
                ctx.strokeStyle = "#107c41";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x, y + height - 1.5);
                ctx.lineTo(x + width, y + height - 1.5);
                ctx.stroke();
                ctx.restore();
            }

            // Text
            const cell = this.getCell(0, col);
            if (cell.data) {
                ctx.font = "14px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#616161";
                ctx.fillText(cell.data, x + width / 2, y + height / 2);
            }
        }

        // --- 5. Draw STICKY ROW HEADERS (col 0, fixed at left) ---
        for (let row = startRow; row < endRow; ++row) {
            const x = 0;
            const y = rowOffsets[row] - scrollTop;
            const width = this.columnWidths[0];
            const height = this.rowHeights[row];

            const selectedRow = this.cellSelector?.selectedRow;
            ctx.fillStyle = selectedRow === row ? "#caead8" : "#f5f5f5";
            ctx.fillRect(x, y, width, height);

            ctx.strokeStyle = "#e0e0e0";
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, width, height);

            if (selectedRow === row && !this.cellSelector?.isDragging) {
                ctx.save();
                ctx.strokeStyle = "#107c41";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x + width - 1.5, y);
                ctx.lineTo(x + width - 1.5, y + height);
                ctx.stroke();
                ctx.restore();
            }

            // Header text
            const cell = this.getCell(row, 0);
            if (cell.data) {
                ctx.fillStyle = "#616161";
                ctx.font = "14px Arial";
                ctx.textAlign = "right";
                ctx.textBaseline = "bottom";
                ctx.fillText(cell.data, x + width - 8, y + height - 4);
            }
        }

        // --- 6. Draw CORNER CELL (0,0) - Always visible ---
        const cornerX = 0;
        const cornerY = 0;
        const cornerWidth = this.columnWidths[0];
        const cornerHeight = this.rowHeights[0];

        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(cornerX, cornerY, cornerWidth, cornerHeight);
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 1;
        ctx.strokeRect(cornerX + 0.5, cornerY + 0.5, cornerWidth, cornerHeight);

        ctx.restore();
    }
}