import { MAX_GRID_COLS, MAX_GRID_ROWS, MIN_GRIDCELL_HEIGHT, MIN_GRIDCELL_WIDTH } from "../constants.js";
import { GridCell } from "./GridCell.js";

/**
 * GridMatrix is responsible for managing the 2D grid structure of cells,
 * including layout, sizing, and rendering logic.
 */
export class GridMatrix {

    /** Total number of rows in the grid */
    noOfRows: number = MAX_GRID_ROWS;

    /** Total number of columns in the grid */
    noOfCols: number = MAX_GRID_COLS;

    /** 2D array representing the grid of cells */
    grid: GridCell[][] = [];

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
     * for each row and column, and assigning appropriate positions and sizes.
     */
    initializeGrid() {
        this.grid = [];

        for (let row = 0; row < this.noOfRows; row++) {
            const rowCells: GridCell[] = [];

            // Calculate vertical position of the current row
            let y = this.rowHeights.slice(0, row).reduce((a, b) => a + b, 0);

            for (let col = 0; col < this.noOfCols; col++) {
                // Generate Excel-style column header (A, B, ..., AA, AB, etc.)
                const header = GridCell.generateHeader(col - 1);
                const id = `${row}${header}`;

                // Calculate horizontal position of the current column
                let x = this.columnWidths.slice(0, col).reduce((a, b) => a + b, 0);
                let width = this.columnWidths[col];
                let height = this.rowHeights[row];

                // Assign header labels for first row and column
                let data: string | undefined;
                if (row === 0 && col === 0) data = "";
                else if (row === 0) data = header;
                else if (col === 0) data = `${row}`;

                const cell = new GridCell(id, x, y, this.c, width, height, data);
                rowCells.push(cell);
            }

            this.grid.push(rowCells);
        }
    }

    /**
     * Renders the entire grid onto the canvas, including cell borders and labels.
     * 
     * @param ctx - Canvas 2D rendering context
     */
    drawGrid(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 1;
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#000";

        // Draw header background
        ctx.fillStyle = "#f0f0f0";

        // Draw column headers background
        for (let col = 0; col < this.noOfCols; col++) {
            const cell = this.grid[0][col];
            ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
        }

        // Draw row headers background
        for (let row = 0; row < this.noOfRows; row++) {
            const cell = this.grid[row][0];
            ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
        }

        ctx.fillStyle = "#000";

        // Draw all cells
        for (let row of this.grid) {
            for (let cell of row) {
                ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);

                if (cell.data) {
                    let text = cell.data;
                    const ellipsis = "...";
                    const maxWidth = cell.width - 10; // padding

                    // Check if text needs truncation
                    if (ctx.measureText(text).width > maxWidth) {
                        let truncatedText = text;
                        while (ctx.measureText(truncatedText + ellipsis).width > maxWidth && truncatedText.length > 0) {
                            truncatedText = truncatedText.slice(0, -1);
                        }
                        text = truncatedText + ellipsis;
                    }

                    ctx.fillText(text, cell.x + cell.width / 2, cell.y + cell.height / 2);
                }
            }
        }
    }

}