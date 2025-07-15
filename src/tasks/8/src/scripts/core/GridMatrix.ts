import { MAX_GRID_COLS, MAX_GRID_ROWS, MIN_GRIDCELL_HEIGHT, MIN_GRIDCELL_WIDTH } from "../constants.js";
import { CellSelector } from "./CellSelector.js";
import { GridCell } from "./GridCell.js";


/**
 * GridMatrix represents a 2D grid of cells with dynamic row/column management.
 * It handles cell creation, resizing, and viewport calculations.
 */
export class GridMatrix {
    /** Default number of rows and columns in the grid */
    noOfRows: number;
    /** Default number of columns in the grid */
    noOfCols: number;

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
    constructor(_c: CanvasRenderingContext2D, rows: number, cols: number) {
        this.noOfRows = rows;
        this.noOfCols = cols;
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
        // Match function name and argument
        const match = expr.match(/^(\w+)\(([^)]+)\)$/);
        if (!match) return "#FORMULA!";
        const fn = match[1].toUpperCase();
        const arg = match[2];
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
        const minWidth = MIN_GRIDCELL_WIDTH;
        let width = Math.ceil(maxWidth + padding);
        width = Math.max(width, minWidth);

        // Optional: Smoother growth for very large numbers
        // if (width > 100) width = 100 + Math.log(width - 99) * 40;

        // Set the width for the row header column (col 0)
        this.columnWidths[0] = width;
    }




    /**
     * Draws the grid on the specified canvas context.
     * @param ctx CanvasRenderingContext2D - The context to draw on.
     * @param viewport The visible area of the grid.
     * @param scrollLeft The horizontal scroll position.
     * @param scrollTop The vertical scroll position.
     * @param previewColIndex (optional) If set, use previewColWidth ONLY for the header cell at this column.
     * @param previewColWidth (optional) The temporary width to use for the header cell at previewColIndex.
     * @param suppressHeaderSelectionColor (optional) If true, don't highlight header selection (for preview mode).
     */
    drawGrid(
        ctx: CanvasRenderingContext2D,
        viewport?: { startRow: number, endRow: number, startCol: number, endCol: number },
        scrollLeft: number = 0, scrollTop: number = 0,
        previewColIndex?: number, previewColWidth?: number,
        suppressHeaderSelectionColor?: boolean,
        selectedColP?: number[],
        cellSelectionArr?: number[],
        previewRowIndex?: number,
        previewRowHeight?: number,
        selectedRowsP?: number[]
    ) {
        this.updateRowHeaderWidth(ctx);
        ctx.save();

        // Compute Offsets
        const {
            colOffsetsHeader,
            colOffsetsData,
            rowHeightsPreview,
            rowOffsetsHeader,
            rowOffsetsData,
            startRow,
            endRow,
            startCol,
            endCol
        } = this.computeOffsets(
            viewport, previewColIndex, previewColWidth,
            previewRowIndex, previewRowHeight
        );


        // Draw grid lines
        this.drawGridLines(ctx, colOffsetsData, rowOffsetsData, startCol, endCol, startRow, endRow, scrollLeft, scrollTop);


        // Draw data cells
        this.drawDataCells(ctx, colOffsetsData, rowOffsetsData, startCol, endCol, startRow, endRow, scrollLeft, scrollTop);

        ctx.restore(); 

        ctx.save();
        // ---- HEADER REGION ----
        // Draw column headers, including selection highlight
        this.drawColumnHeaders(
            ctx, colOffsetsHeader, startCol, endCol, scrollLeft, previewColIndex, previewColWidth,
            suppressHeaderSelectionColor, selectedColP, cellSelectionArr
        );

        // Draw row headers, including selection highlight
        this.drawRowHeaders(
            ctx, rowOffsetsHeader, rowHeightsPreview, startRow, endRow, scrollTop, previewRowIndex, previewRowHeight, suppressHeaderSelectionColor,
            selectedRowsP
        );

        // Draw corner cell
        this.drawCornerCell(ctx);

        ctx.restore();
    }



    computeOffsets(
        viewport?: { startRow: number, endRow: number, startCol: number, endCol: number },
        previewColIndex?: number, previewColWidth?: number,
        previewRowIndex?: number, previewRowHeight?: number
    ) {
        const startRow = viewport?.startRow ?? 0;
        const endRow = viewport?.endRow ?? this.noOfRows;
        const startCol = viewport?.startCol ?? 0;
        const endCol = viewport?.endCol ?? this.noOfCols;

        let colOffsetsHeader: number[] = [0];
        let colOffsetsData: number[] = [0];
        for (let c = 0; c < this.noOfCols; ++c) {
            let headerW = this.columnWidths[c];
            if (previewColIndex !== undefined && previewColWidth !== undefined && c === previewColIndex) {
                headerW = previewColWidth;
            }
            colOffsetsHeader[c + 1] = colOffsetsHeader[c] + headerW;
            colOffsetsData[c + 1] = colOffsetsData[c] + this.columnWidths[c];
        }

        let rowHeightsPreview = [...this.rowHeights];
        if (
            typeof previewRowIndex === "number" &&
            typeof previewRowHeight === "number" &&
            previewRowIndex >= 0
        ) {
            rowHeightsPreview[previewRowIndex] = previewRowHeight;
        }
        let rowOffsetsHeader: number[] = [0];
        let rowOffsetsData: number[] = [0];
        for (let r = 0; r < this.noOfRows; ++r) {
            let rh = rowHeightsPreview[r];
            rowOffsetsHeader[r + 1] = rowOffsetsHeader[r] + rh;
            rowOffsetsData[r + 1] = rowOffsetsData[r] + this.rowHeights[r];
        }

        return {
            colOffsetsHeader,
            colOffsetsData,
            rowHeightsPreview,
            rowOffsetsHeader,
            rowOffsetsData,
            startRow,
            endRow,
            startCol,
            endCol
        };
    }



    drawGridLines(
        ctx: CanvasRenderingContext2D,
        colOffsetsData: number[], rowOffsetsData: number[],
        startCol: number, endCol: number, startRow: number, endRow: number,
        scrollLeft: number, scrollTop: number
    ) {
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 1;
        const align = (v: number) => Math.round(v) + 0.5;

        // Vertical lines
        for (let c = Math.max(1, startCol); c <= endCol; ++c) {
            let x = align(colOffsetsData[c] - scrollLeft);
            ctx.beginPath();
            ctx.moveTo(x, Math.max(this.rowHeights[0], rowOffsetsData[Math.max(1, startRow)] - scrollTop));
            ctx.lineTo(x, rowOffsetsData[endRow] - scrollTop);
            ctx.stroke();
        }
        // Horizontal lines
        for (let r = Math.max(1, startRow); r <= endRow; ++r) {
            let y = align(rowOffsetsData[r] - scrollTop);
            ctx.beginPath();
            ctx.moveTo(Math.max(this.columnWidths[0], colOffsetsData[Math.max(1, startCol)] - scrollLeft), y);
            ctx.lineTo(colOffsetsData[endCol] - scrollLeft, y);
            ctx.stroke();
        }
    }

    drawDataCells(
        ctx: CanvasRenderingContext2D,
        colOffsetsData: number[], rowOffsetsData: number[],
        startCol: number, endCol: number, startRow: number, endRow: number,
        scrollLeft: number, scrollTop: number
    ) {
        ctx.font = "14px Arial";
        ctx.fillStyle = "#000";
        for (let row = Math.max(1, startRow); row < endRow; ++row) {
            for (let col = Math.max(1, startCol); col < endCol; ++col) {
                const x = colOffsetsData[col] - scrollLeft;
                const y = rowOffsetsData[row] - scrollTop;
                const width = this.columnWidths[col];
                const height = this.rowHeights[row];
                const cell = this.getCell(row, col);
                const displayValue = this.evaluateCell(cell);

                let text = "";
                let isNumber = false;

                // if (displayValue !== undefined && displayValue !== "") {
                //     text = typeof displayValue === "number"
                //         ? displayValue.toLocaleString(undefined, { maximumFractionDigits: 6 })
                //         : displayValue;
                //     isNumber = typeof displayValue === "number" || (!isNaN(parseFloat(displayValue)) && isFinite(parseFloat(displayValue)));
                // } else if (cell.data) {
                //     text = cell.data;
                //     isNumber = !isNaN(parseFloat(text)) && isFinite(parseFloat(text));
                // }

               if(cell.data) {
                    text = cell.data;
                    isNumber = !isNaN(parseFloat(text)) && isFinite(parseFloat(text));
                }

                ctx.textBaseline = "middle";
                ctx.font = "14px Arial";
                ctx.fillStyle = "#000";

                if (isNumber) {
                    ctx.textAlign = "right";
                    ctx.fillText(text, x + width - 8, y + height / 2); // 8px right padding
                } else {
                    ctx.textAlign = "left";
                    ctx.fillText(text, x + 8, y + height / 2); // 8px left padding
                }
            }
        }
    }

    drawColumnHeaders(
        ctx: CanvasRenderingContext2D,
        colOffsetsHeader: number[], startCol: number, endCol: number,
        scrollLeft: number,
        previewColIndex?: number, previewColWidth?: number,
        suppressHeaderSelectionColor?: boolean,
        selectedColP?: number[],
        cellSelectionArr?: number[]
    ) {
        for (let col = startCol; col < endCol; ++col) {
            const x = Math.round(colOffsetsHeader[col] - scrollLeft);
            const y = 0;
            const width = Math.round(
                previewColIndex !== undefined && previewColWidth !== undefined && col === previewColIndex
                    ? previewColWidth
                    : this.columnWidths[col]
            );
            const height = Math.round(this.rowHeights[0]);

            // Selection logic
            let isSelected = false;
            if (Array.isArray(selectedColP) && selectedColP.length) {
                isSelected = selectedColP.includes(col);
            } else if (typeof this.cellSelector?.selectedCol === "number" && this.cellSelector.selectedCol === col) {
                isSelected = true;
            } else if (Array.isArray(cellSelectionArr) && cellSelectionArr.length) {
                isSelected = cellSelectionArr.includes(col);
            }

            // Background and text color
            let bgColor = "#f5f5f5";
            let textColor = "#616161";
            if (suppressHeaderSelectionColor && isSelected) {
                if (Array.isArray(selectedColP) && selectedColP.length) {
                    bgColor = "#107c41";
                    textColor = "#fff";
                } else if (Array.isArray(cellSelectionArr) && cellSelectionArr.length) {
                    bgColor = "#e8f1ec";
                } else {
                    bgColor = "#caead8";
                }
            } else if (this.cellSelector && this.cellSelector.selectedCol === col) {
                bgColor = "#caead8";
            }

            ctx.fillStyle = bgColor;
            ctx.fillRect(x, y, width, height);

            // Border
            ctx.save();
            ctx.translate(0.5, 0.5);
            ctx.strokeStyle = "#e0e0e0";
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, width, height);
            ctx.restore();

            // Thick green bottom border for selected
            if ((suppressHeaderSelectionColor && isSelected && (!selectedColP || selectedColP.length === 0)) ||
                (this.cellSelector && this.cellSelector.selectedCol === col)) {
                ctx.save();
                ctx.translate(0.5, 0.5);
                ctx.strokeStyle = "#107c41";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y + height - 1);
                ctx.lineTo(x + width, y + height - 1);
                ctx.stroke();
                ctx.restore();
            }

            // Text
            const cell = this.getCell(0, col);
            if (cell.data) {
                ctx.font = "14px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = textColor;
                ctx.fillText(cell.data, x + width / 2, y + height / 2);
            }
        }
    }


    drawRowHeaders(
        ctx: CanvasRenderingContext2D,
        rowOffsetsHeader: number[], rowHeightsPreview: number[],
        startRow: number, endRow: number, scrollTop: number,
        previewRowIndex?: number, previewRowHeight?: number,
        suppressHeaderSelectionColor?: boolean,
        selectedRowsP?: number[]
    ) {
        for (let row = startRow; row < endRow; ++row) {
            const x = 0;
            const y = Math.round(rowOffsetsHeader[row] - scrollTop);
            const width = Math.round(this.columnWidths[0]);
            let height = Math.round(rowHeightsPreview[row]);

            if (typeof previewRowIndex === "number" &&
                typeof previewRowHeight === "number" &&
                previewRowIndex === row) {
                height = Math.round(previewRowHeight);
            }

            // Selection logic
            let isSelected = false;
            if (Array.isArray(selectedRowsP) && selectedRowsP.length) {
                isSelected = selectedRowsP.includes(row);
            } else if (typeof this.cellSelector?.selectedRow === "number" && this.cellSelector.selectedRow === row) {
                isSelected = true;
            }

            // Background and text color
            let bgColor = "#f5f5f5";
            let textColor = "#616161";
            if (suppressHeaderSelectionColor && isSelected) {
                if (Array.isArray(selectedRowsP) && selectedRowsP.length) {
                    bgColor = "#107c41";
                    textColor = "#fff";
                } else {
                    bgColor = "#caead8";
                }
            } else if (this.cellSelector && this.cellSelector.selectedRow === row) {
                bgColor = "#caead8";
            }

            ctx.fillStyle = bgColor;
            ctx.fillRect(x, y, width, height);

            // Border
            ctx.save();
            ctx.translate(0.5, 0.5);
            ctx.strokeStyle = "#e0e0e0";
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, width, height);
            ctx.restore();

            // Thick green right border for selected
            if ((suppressHeaderSelectionColor && isSelected && (!selectedRowsP || selectedRowsP.length === 0)) ||
                (this.cellSelector && this.cellSelector.selectedRow === row)) {
                ctx.save();
                ctx.translate(0.5, 0.5);
                ctx.strokeStyle = "#107c41";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + width - 1, y);
                ctx.lineTo(x + width - 1, y + height);
                ctx.stroke();
                ctx.restore();
            }

            // Text
            const cell = this.getCell(row, 0);
            if (cell.data) {
                ctx.font = "14px Arial";
                ctx.textAlign = "right";
                ctx.textBaseline = "bottom";
                ctx.fillStyle = textColor;
                ctx.fillText(cell.data, x + width - 8, y + height - 4);
            }
        }
    }


    drawCornerCell(ctx: CanvasRenderingContext2D) {
        const cornerX = 0;
        const cornerY = 0;
        const cornerWidth = this.columnWidths[0];
        const cornerHeight = this.rowHeights[0];
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(cornerX, cornerY, cornerWidth, cornerHeight);
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 1;
        ctx.strokeRect(cornerX + 0.5, cornerY + 0.5, cornerWidth, cornerHeight);
    }

}