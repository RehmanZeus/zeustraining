const MAX_GRID_ROWS = 100000;
const MAX_GRID_COLS = 500 + 1;
const MIN_GRIDCELL_WIDTH = 60;
const MIN_GRIDCELL_HEIGHT = 20;
const DPR = window.devicePixelRatio || 1;

/**
 * SetupExcelSheet is responsible for initializing and configuring the canvas
 * used to render the Excel-like grid interface. It calculates canvas dimensions
 * based on grid size and provides access to the 2D rendering context.
 */
class SetupExcelSheet {

    /** Width of the canvas in pixels, derived from number of columns and cell width */
    canvasWidth: number = window.innerWidth;

    /** Height of the canvas in pixels, derived from number of rows and cell height */
    canvasHeight: number = window.innerHeight;

    /** Reference to the HTML canvas element used for rendering */
    canvas!: HTMLCanvasElement;

    /** 2D rendering context for drawing on the canvas */
    ctx!: CanvasRenderingContext2D;

    /**
     * Constructs the SetupExcelSheet instance and calculates canvas dimensions.
     * 
     * @param gridWidth - Width of each grid cell
     * @param gridHeight - Height of each grid cell
     * @param nrows - Total number of rows in the grid
     * @param ncols - Total number of columns in the grid
     */
    constructor(gridWidth: number, gridHeight: number, nrows: number, ncols: number) {
        this.canvasWidth = ncols * gridWidth;
        this.canvasHeight = nrows * gridHeight;
    }

    /**
     * Initializes the canvas element by setting its dimensions and scaling
     * for high-DPI displays. Also retrieves and stores the 2D rendering context.
     * 
     * @returns The initialized HTMLCanvasElement
     */
    init(): HTMLCanvasElement {
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;

        this.ctx = this.canvas.getContext("2d")!;
        this.ctx.scale(DPR, DPR); // Adjust for device pixel ratio

        return this.canvas;
    }

    /**
     * Provides access to the canvas's 2D rendering context.
     * 
     * @returns CanvasRenderingContext2D
     */
    getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }
}


/**
 * GridResizer handles interactive resizing of grid columns and rows
 * via pointer events on the canvas. It updates the grid layout dynamically
 * and ensures accurate rendering and interaction after each resize.
 */
class GridResizer {
    /** Canvas element where the grid is rendered */
    canvas: HTMLCanvasElement;

    /** Canvas 2D rendering context */
    ctx: CanvasRenderingContext2D;

    /** Reference to the GridMatrix instance being manipulated */
    gridMatrix: GridMatrix;

    /** Flags and indices for tracking active resize operations */
    isResizingCol = false;
    isResizingRow = false;
    resizingColIndex = -1;
    resizingRowIndex = -1;

    /** Starting pointer coordinates for resize calculations */
    startX = 0;
    startY = 0;

    /** Pixel threshold to detect proximity to column/row edges */
    resizeThreshold = 5;

    /**
     * Constructs a GridResizer instance and attaches pointer event listeners.
     * 
     * @param canvas - HTML canvas element
     * @param ctx - Canvas 2D rendering context
     * @param gridMatrix - GridMatrix instance to be resized
     */
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;

        this.attachEvents();
    }

    /**
     * Attaches pointer event listeners for resizing interactions.
     */
    attachEvents() {
        this.canvas.addEventListener("pointermove", this.handleMouseMove.bind(this));
        this.canvas.addEventListener("pointerdown", this.handleMouseDown.bind(this));
        this.canvas.addEventListener("pointerup", this.handleMouseUp.bind(this));
        this.canvas.addEventListener("pointermove", this.handleResize.bind(this));
    }

    /**
     * Handles pointer movement to detect proximity to column or row edges
     * and updates the cursor style accordingly.
     */
    handleMouseMove(e: MouseEvent) {
        const { x, y } = this.getMousePosition(e);
        const colIndex = this.getColumnIndex(x);
        const rowIndex = this.getRowIndex(y);

        const colEdge = this.gridMatrix.columnWidths.slice(0, colIndex + 1).reduce((a, b) => a + b, 0);
        const rowEdge = this.gridMatrix.rowHeights.slice(0, rowIndex + 1).reduce((a, b) => a + b, 0);

        if (Math.abs(x - colEdge) < this.resizeThreshold) {
            this.canvas.style.cursor = "col-resize";
        } else if (Math.abs(y - rowEdge) < this.resizeThreshold) {
            this.canvas.style.cursor = "row-resize";
        } else {
            this.canvas.style.cursor = "default";
        }
    }

    /**
     * Handles pointer down event to initiate column or row resizing.
     */
    handleMouseDown(e: MouseEvent) {
        const { x, y } = this.getMousePosition(e);
        const colIndex = this.getColumnIndex(x);
        const rowIndex = this.getRowIndex(y);

        const colEdge = this.gridMatrix.columnWidths.slice(0, colIndex + 1).reduce((a, b) => a + b, 0);
        const rowEdge = this.gridMatrix.rowHeights.slice(0, rowIndex + 1).reduce((a, b) => a + b, 0);

        if (Math.abs(x - colEdge) < this.resizeThreshold) {
            this.isResizingCol = true;
            this.resizingColIndex = colIndex;
            this.startX = x;
        } else if (Math.abs(y - rowEdge) < this.resizeThreshold) {
            this.isResizingRow = true;
            this.resizingRowIndex = rowIndex;
            this.startY = y;
        }
    }

    /**
     * Handles pointer up event to finalize resizing.
     */
    handleMouseUp() {
        this.isResizingCol = false;
        this.isResizingRow = false;
        this.resizingColIndex = -1;
        this.resizingRowIndex = -1;
    }

    /**
     * Dynamically updates column widths or row heights based on pointer movement
     * and recalculates cell positions and dimensions.
     */
    handleResize(e: MouseEvent) {
        if (!this.isResizingCol && !this.isResizingRow) return;

        const { x, y } = this.getMousePosition(e);

        if (this.isResizingCol && this.resizingColIndex > 0) {
            const delta = x - this.startX;
            const newWidth = this.gridMatrix.columnWidths[this.resizingColIndex] + delta;

            if (newWidth >= MIN_GRIDCELL_WIDTH) {
                this.gridMatrix.columnWidths[this.resizingColIndex] = newWidth;
                this.startX = x;
            }
        }

        if (this.isResizingRow && this.resizingRowIndex > 0) {
            const delta = y - this.startY;
            const newHeight = this.gridMatrix.rowHeights[this.resizingRowIndex] + delta;

            if (newHeight >= MIN_GRIDCELL_HEIGHT) {
                this.gridMatrix.rowHeights[this.resizingRowIndex] = newHeight;
                this.startY = y;
            }
        }

        // Recalculate positions and dimensions of all cells
        for (let row = 0; row < this.gridMatrix.noOfRows; row++) {
            let y = this.gridMatrix.rowHeights.slice(0, row).reduce((a, b) => a + b, 0);
            const rowCells = this.gridMatrix.grid[row];

            for (let col = 0; col < this.gridMatrix.noOfCols; col++) {
                let x = this.gridMatrix.columnWidths.slice(0, col).reduce((a, b) => a + b, 0);
                const cell = rowCells[col];

                cell.x = x;
                cell.y = y;
                cell.width = this.gridMatrix.columnWidths[col];
                cell.height = this.gridMatrix.rowHeights[row];
            }
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.gridMatrix.drawGrid(this.ctx);
    }

    /**
     * Calculates the column index based on pointer X position and dynamic column widths.
     */
    getColumnIndex(x: number): number {
        let total = 0;
        for (let i = 0; i < this.gridMatrix.columnWidths.length; i++) {
            total += this.gridMatrix.columnWidths[i];
            if (x < total) return i;
        }
        return -1;
    }

    /**
     * Calculates the row index based on pointer Y position and dynamic row heights.
     */
    getRowIndex(y: number): number {
        let total = 0;
        for (let i = 0; i < this.gridMatrix.rowHeights.length; i++) {
            total += this.gridMatrix.rowHeights[i];
            if (y < total) return i;
        }
        return -1;
    }

    /**
     * Converts pointer event coordinates to canvas-relative coordinates.
     */
    getMousePosition(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
}

/**
 * GridCell represents a single cell within the grid matrix.
 * It stores positional data, dimensions, content, and rendering context.
 */
class GridCell {

    /** Unique identifier for the cell, typically a combination of row and column (e.g., "0A") */
    id: string;

    /** Height of the cell in pixels */
    height: number = MIN_GRIDCELL_HEIGHT;

    /** Width of the cell in pixels */
    width: number = MIN_GRIDCELL_WIDTH;

    /** X-axis position of the cell on the canvas */
    x: number = 0;

    /** Y-axis position of the cell on the canvas */
    y: number = 0;

    /** Content of the cell, which may be user input or loaded data */
    data: string | undefined;

    /** Canvas 2D rendering context used for drawing the cell */
    c: CanvasRenderingContext2D;

    /**
     * Constructs a GridCell instance with optional dimensions and content.
     * 
     * @param id - Unique identifier for the cell
     * @param x - X-axis position of the cell
     * @param y - Y-axis position of the cell
     * @param c - Canvas 2D rendering context
     * @param width - Optional width of the cell
     * @param height - Optional height of the cell
     * @param data - Optional initial content of the cell
     */
    constructor(
        id: string,
        x: number,
        y: number,
        c: CanvasRenderingContext2D,
        width?: number,
        height?: number,
        data?: string
    ) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.c = c;
        this.width = width ?? this.width;
        this.height = height ?? this.height;
        this.data = data;
    }

    /**
     * Generates an Excel-style column header string based on a zero-based index.
     * For example: 0 → "A", 25 → "Z", 26 → "AA", etc.
     * 
     * @param index - Zero-based column index
     * @returns Column header string
     */
    static generateHeader(index: number): string {
        let header = "";
        while (index >= 0) {
            header = String.fromCharCode((index % 26) + 65) + header;
            index = Math.floor(index / 26) - 1;
        }
        return header;
    }
}


/**
 * GridMatrix is responsible for managing the 2D grid structure of cells,
 * including layout, sizing, and rendering logic.
 */
class GridMatrix {

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
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let row of this.grid) {
            for (let cell of row) {
                ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
                if (cell.data) {
                    ctx.fillText(cell.data, cell.x + cell.width / 2, cell.y + cell.height / 2);
                }
            }
        }
    }
}




const handleGridCell = () => { }

window.onload = () => {
    const setup = new SetupExcelSheet(MIN_GRIDCELL_WIDTH, MIN_GRIDCELL_HEIGHT, 500, 100);
    const canvas = setup.init();
    const ctx = setup.getContext();

    const gridMatrix = new GridMatrix(ctx, 500, 100);
    gridMatrix.drawGrid(ctx);

    new GridResizer(canvas, ctx, gridMatrix);
};
