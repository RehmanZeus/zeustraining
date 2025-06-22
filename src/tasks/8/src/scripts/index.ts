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
    canvasWidth: number; // Remove the default assignment

    /** Height of the canvas in pixels, derived from number of rows and cell height */
    canvasHeight: number; // Remove the default assignment

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
        // Calculate canvas dimensions based on total grid size
        this.canvasWidth = gridWidth * ncols;
        this.canvasHeight = gridHeight * nrows;
        
        // Debug: Log the calculated dimensions
        console.log(`Calculated canvas dimensions: ${this.canvasWidth}x${this.canvasHeight}`);
        console.log(`Grid: ${ncols} cols x ${nrows} rows, Cell: ${gridWidth}x${gridHeight}`);
    }

    /**
     * Initializes the canvas element by setting its dimensions and scaling
     * for high-DPI displays. Also retrieves and stores the 2D rendering context.
     * 
     * @returns The initialized HTMLCanvasElement
     */
    init(): HTMLCanvasElement {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        
        // Set canvas dimensions in CSS pixels
        this.canvas.style.width = this.canvasWidth + 'px';
        this.canvas.style.height = this.canvasHeight + 'px';
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0';
        this.canvas.style.padding = '0';
        
        // Set actual canvas dimensions accounting for device pixel ratio
        this.canvas.width = this.canvasWidth * DPR;
        this.canvas.height = this.canvasHeight * DPR;
        
        // Scale context to match DPR
        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.scale(DPR, DPR);
        
        // Create a container with scrolling capability
        const container = document.createElement('div');
        container.id = 'excel-container';
        
        // Set container to viewport size
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.overflow = 'auto';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.margin = '0';
        container.style.padding = '0';
        container.style.boxSizing = 'border-box';

        // Ensure body doesn't interfere with scrolling
        document.body.style.overflow = 'hidden';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        
        // Clear any existing content and add container
        document.body.innerHTML = '';
        
        // Add the canvas to the container
        container.appendChild(this.canvas);
        document.body.appendChild(container);
        
        // Force reflow
        container.offsetHeight;
        
        // Debug logging
        console.log(`Canvas CSS dimensions: ${this.canvasWidth}x${this.canvasHeight}`);
        console.log(`Canvas actual dimensions: ${this.canvas.width}x${this.canvas.height}`);
        console.log(`Container client size: ${container.clientWidth}x${container.clientHeight}`);
        console.log(`Container scroll size: ${container.scrollWidth}x${container.scrollHeight}`);
        
        // Verify scrolling capability
        const canScrollH = container.scrollWidth > container.clientWidth;
        const canScrollV = container.scrollHeight > container.clientHeight;
        console.log(`Can scroll horizontally: ${canScrollH}`);
        console.log(`Can scroll vertically: ${canScrollV}`);
        
        if (!canScrollH && !canScrollV) {
            console.warn('⚠️ Canvas is not larger than viewport - no scrolling needed');
        } else {
            console.log('✅ Canvas should be scrollable');
        }
        
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
 * CellSelector handles cell selection, highlighting, and input functionality
 * for the Excel-like grid interface. It manages the active cell state and
 * provides input capabilities similar to Excel.
 */
class CellSelector {
    /** Canvas element where the grid is rendered */
    canvas: HTMLCanvasElement;

    /** Canvas 2D rendering context */
    ctx: CanvasRenderingContext2D;

    /** Reference to the GridMatrix instance */
    gridMatrix: GridMatrix;

    /** Currently selected cell coordinates */
    selectedRow = -1;
    selectedCol = -1;

    /** Input element for cell editing */
    inputElement!: HTMLInputElement;

    /** Flag to track if currently editing */
    isEditing = false;

    /** Selection highlight color */
    selectionColor = '#4285f4';
    selectionBorderColor = '#1a73e8';

    /**
     * Constructs a CellSelector instance and sets up input handling.
     * 
     * @param canvas - HTML canvas element
     * @param ctx - Canvas 2D rendering context
     * @param gridMatrix - GridMatrix instance
     */
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;

        this.createInputElement();
        this.attachEvents();
    }

    /**
     * Creates an invisible input element for cell editing
     */
    createInputElement() {
        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';
        this.inputElement.style.position = 'absolute';
        this.inputElement.style.border = '2px solid #1a73e8';
        this.inputElement.style.outline = 'none';
        this.inputElement.style.font = '12px Arial';
        this.inputElement.style.padding = '2px';
        this.inputElement.style.margin = '0';
        this.inputElement.style.boxSizing = 'border-box';
        this.inputElement.style.backgroundColor = 'white';
        this.inputElement.style.zIndex = '1000';
        this.inputElement.style.display = 'none';
        
        document.body.appendChild(this.inputElement);

        // Input element event listeners
        this.inputElement.addEventListener('blur', this.finishEditing.bind(this));
        this.inputElement.addEventListener('keydown', this.handleInputKeydown.bind(this));
    }

    /**
     * Attaches event listeners for cell selection
     */
    attachEvents() {
        this.canvas.addEventListener('click', this.handleCellClick.bind(this));
        this.canvas.addEventListener('dblclick', this.handleCellDoubleClick.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    /**
     * Handles single click on canvas to select cells
     */
    handleCellClick(e: MouseEvent) {
        // Don't interfere with resizing operations
        if (this.canvas.style.cursor === 'col-resize' || this.canvas.style.cursor === 'row-resize') {
            return;
        }

        const { x, y } = this.getMousePosition(e);
        const { row, col } = this.getCellFromPosition(x, y);

        // Don't select header cells
        if (row > 0 && col > 0 && row < this.gridMatrix.noOfRows && col < this.gridMatrix.noOfCols) {
            this.selectCell(row, col);
        }
    }

    /**
     * Handles double click to start editing
     */
    handleCellDoubleClick(e: MouseEvent) {
        if (this.selectedRow > 0 && this.selectedCol > 0) {
            this.startEditing();
        }
    }

    /**
     * Handles keyboard navigation and editing
     */
    handleKeydown(e: KeyboardEvent) {
        if (this.isEditing) return;

        if (this.selectedRow === -1 || this.selectedCol === -1) return;

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.moveSelection(-1, 0);
                break;
            case 'ArrowDown':
            case 'Enter':
                e.preventDefault();
                this.moveSelection(1, 0);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.moveSelection(0, -1);
                break;
            case 'ArrowRight':
            case 'Tab':
                e.preventDefault();
                this.moveSelection(0, 1);
                break;
            case 'F2':
                e.preventDefault();
                this.startEditing();
                break;
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                this.clearSelectedCell();
                break;
            default:
                // Start editing if a printable character is pressed
                if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    this.startEditing(e.key);
                }
                break;
        }
    }

    /**
     * Handles input element keydown events
     */
    handleInputKeydown(e: KeyboardEvent) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                this.finishEditing();
                this.moveSelection(1, 0);
                break;
            case 'Tab':
                e.preventDefault();
                this.finishEditing();
                this.moveSelection(0, e.shiftKey ? -1 : 1);
                break;
            case 'Escape':
                e.preventDefault();
                this.cancelEditing();
                break;
        }
    }

    /**
     * Selects a specific cell and highlights it
     */
    selectCell(row: number, col: number) {
        if (this.isEditing) {
            this.finishEditing();
        }

        this.selectedRow = row;
        this.selectedCol = col;
        this.redrawGrid();
    }

    /**
     * Moves selection by the specified offset
     */
    moveSelection(rowOffset: number, colOffset: number) {
        const newRow = Math.max(1, Math.min(this.gridMatrix.noOfRows - 1, this.selectedRow + rowOffset));
        const newCol = Math.max(1, Math.min(this.gridMatrix.noOfCols - 1, this.selectedCol + colOffset));
        
        this.selectCell(newRow, newCol);
    }

    /**
     * Starts editing the selected cell
     */
    startEditing(initialValue?: string) {
        if (this.selectedRow <= 0 || this.selectedCol <= 0) return;

        const cell = this.gridMatrix.grid[this.selectedRow][this.selectedCol];
        const canvasRect = this.canvas.getBoundingClientRect();
        const container = this.canvas.parentElement!;
        
        // Calculate exact pixel position with scroll offsets
        const exactLeft = canvasRect.left + cell.x - container.scrollLeft;
        const exactTop = canvasRect.top + cell.y - container.scrollTop;
        
        // Position input element
        this.inputElement.style.position = 'absolute';
        this.inputElement.style.left = exactLeft + 'px';
        this.inputElement.style.top = exactTop + 'px';
        this.inputElement.style.width = cell.width + 'px';
        this.inputElement.style.height = cell.height + 'px';
        
        // Reset any potential problematic styles
        this.inputElement.style.transform = 'none';
        this.inputElement.style.margin = '0';
        this.inputElement.style.padding = '0 4px';
        this.inputElement.style.display = 'block';
        this.inputElement.style.fontSize = '12px';
        this.inputElement.style.fontFamily = 'Arial';
        this.inputElement.style.lineHeight = cell.height + 'px';
        this.inputElement.style.boxSizing = 'border-box';
        
        // Set initial value
        if (initialValue !== undefined) {
            this.inputElement.value = initialValue;
        } else {
            this.inputElement.value = cell.data || '';
        }

        this.inputElement.focus();
        this.inputElement.select();
        this.isEditing = true;
    }

    /**
     * Finishes editing and saves the value
     */
    finishEditing() {
        if (!this.isEditing) return;

        const cell = this.gridMatrix.grid[this.selectedRow][this.selectedCol];
        cell.data = this.inputElement.value;

        this.inputElement.style.display = 'none';
        this.isEditing = false;
        this.redrawGrid();
        this.canvas.focus();
    }

    /**
     * Cancels editing without saving
     */
    cancelEditing() {
        if (!this.isEditing) return;

        this.inputElement.style.display = 'none';
        this.isEditing = false;
        this.canvas.focus();
    }

    /**
     * Clears the content of the selected cell
     */
    clearSelectedCell() {
        if (this.selectedRow <= 0 || this.selectedCol <= 0) return;

        const cell = this.gridMatrix.grid[this.selectedRow][this.selectedCol];
        cell.data = '';
        this.redrawGrid();
    }

    /**
     * Gets cell coordinates from mouse position
     */
    getCellFromPosition(x: number, y: number): { row: number, col: number } {
        let totalX = 0;
        let totalY = 0;
        let row = -1;
        let col = -1;

        // Find column
        for (let i = 0; i < this.gridMatrix.columnWidths.length; i++) {
            totalX += this.gridMatrix.columnWidths[i];
            if (x < totalX) {
                col = i;
                break;
            }
        }

        // Find row
        for (let i = 0; i < this.gridMatrix.rowHeights.length; i++) {
            totalY += this.gridMatrix.rowHeights[i];
            if (y < totalY) {
                row = i;
                break;
            }
        }

        return { row, col };
    }

    /**
     * Draws the selection highlight
     */
    drawSelection(ctx: CanvasRenderingContext2D) {
        if (this.selectedRow <= 0 || this.selectedCol <= 0) return;

        const cell = this.gridMatrix.grid[this.selectedRow][this.selectedCol];

        // Draw selection background
        ctx.fillStyle = this.selectionColor + '20'; // 20 for transparency
        ctx.fillRect(cell.x, cell.y, cell.width, cell.height);

        // Draw selection border
        ctx.strokeStyle = this.selectionBorderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
        ctx.lineWidth = 1; // Reset line width
    }

    /**
     * Redraws the entire grid with selection highlight
     */
    redrawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width / DPR, this.canvas.height / DPR);
        this.gridMatrix.drawGrid(this.ctx);
        this.drawSelection(this.ctx);
    }

    /**
     * Converts mouse event coordinates to canvas-relative coordinates
     */
    getMousePosition(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const container = this.canvas.parentElement!;
        
        return {
            x: e.clientX - rect.left + container.scrollLeft,
            y: e.clientY - rect.top + container.scrollTop
        };
    }

    /**
     * Gets the currently selected cell data
     */
    getSelectedCellData(): string | undefined {
        if (this.selectedRow <= 0 || this.selectedCol <= 0) return undefined;
        return this.gridMatrix.grid[this.selectedRow][this.selectedCol].data;
    }

    /**
     * Gets the currently selected cell reference (e.g., "A1")
     */
    getSelectedCellReference(): string {
        if (this.selectedRow <= 0 || this.selectedCol <= 0) return '';
        const colHeader = GridCell.generateHeader(this.selectedCol - 1);
        return `${colHeader}${this.selectedRow}`;
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

    /** Reference to CellSelector for proper redrawing */
    cellSelector?: CellSelector;

    /** Flags and indices for tracking active resize operations */
    isResizingCol = false;
    isResizingRow = false;
    resizingColIndex = -1;
    resizingRowIndex = -1;

    /** Starting pointer coordinates for resize calculations */
    startX = 0;
    startY = 0;

    /** Initial width/height when starting resize */
    initialWidth = 0;
    initialHeight = 0;

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
     * Sets the CellSelector reference for proper redrawing
     */
    setCellSelector(cellSelector: CellSelector) {
        this.cellSelector = cellSelector;
    }

    /**
     * Attaches pointer event listeners for resizing interactions.
     */
    attachEvents() {
        this.canvas.addEventListener("pointermove", this.handleMouseMove.bind(this));
        this.canvas.addEventListener("pointerdown", this.handleMouseDown.bind(this));
        this.canvas.addEventListener("pointerup", this.handleMouseUp.bind(this));
    }

    /**
     * Handles pointer movement to detect proximity to column or row edges
     * and updates the cursor style accordingly.
     */
    handleMouseMove(e: PointerEvent) {
        if (this.isResizingCol || this.isResizingRow) {
            this.handleResize(e);
            return;
        }

        const { x, y } = this.getMousePosition(e);
        const { nearColEdge, colIndex } = this.isNearColumnEdge(x);
        const { nearRowEdge, rowIndex } = this.isNearRowEdge(y);

        if (nearColEdge && colIndex > 0) {
            this.canvas.style.cursor = "col-resize";
        } else if (nearRowEdge && rowIndex > 0) {
            this.canvas.style.cursor = "row-resize";
        } else {
            this.canvas.style.cursor = "default";
        }
    }

    /**
     * Handles pointer down event to initiate column or row resizing.
     */
    handleMouseDown(e: PointerEvent) {
        const { x, y } = this.getMousePosition(e);
        const { nearColEdge, colIndex } = this.isNearColumnEdge(x);
        const { nearRowEdge, rowIndex } = this.isNearRowEdge(y);

        if (nearColEdge && colIndex > 0) {
            this.isResizingCol = true;
            this.resizingColIndex = colIndex;
            this.startX = x;
            this.initialWidth = this.gridMatrix.columnWidths[colIndex];
            this.canvas.style.cursor = "col-resize";
            e.preventDefault();
        } else if (nearRowEdge && rowIndex > 0) {
            this.isResizingRow = true;
            this.resizingRowIndex = rowIndex;
            this.startY = y;
            this.initialHeight = this.gridMatrix.rowHeights[rowIndex];
            this.canvas.style.cursor = "row-resize";
            e.preventDefault();
        }
    }

    /**
     * Handles pointer up event to finalize resizing.
     */
    handleMouseUp(e: PointerEvent) {
        this.isResizingCol = false;
        this.isResizingRow = false;
        this.resizingColIndex = -1;
        this.resizingRowIndex = -1;
        this.canvas.style.cursor = "default";
    }

    /**
     * Dynamically updates column widths or row heights based on pointer movement
     * and recalculates cell positions and dimensions.
     */
    handleResize(e: PointerEvent) {
        const { x, y } = this.getMousePosition(e);

        if (this.isResizingCol && this.resizingColIndex >= 0) {
            const delta = x - this.startX;
            const newWidth = Math.max(MIN_GRIDCELL_WIDTH, this.initialWidth + delta);
            
            this.gridMatrix.columnWidths[this.resizingColIndex] = newWidth;
            this.updateGridLayout();
            this.redrawGrid();
        }

        if (this.isResizingRow && this.resizingRowIndex >= 0) {
            const delta = y - this.startY;
            const newHeight = Math.max(MIN_GRIDCELL_HEIGHT, this.initialHeight + delta);
            
            this.gridMatrix.rowHeights[this.resizingRowIndex] = newHeight;
            this.updateGridLayout();
            this.redrawGrid();
        }
    }

    /**
     * Updates the grid layout after resizing by recalculating all cell positions and dimensions
     */
    updateGridLayout() {
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
    }

    /**
     * Redraws the entire grid
     */
    redrawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width / DPR, this.canvas.height / DPR);
        this.gridMatrix.drawGrid(this.ctx);
        
        // Redraw selection if CellSelector is available
        if (this.cellSelector) {
            this.cellSelector.drawSelection(this.ctx);
        }
    }

    /**
     * Checks if the mouse is near a column edge and returns the edge information
     */
    isNearColumnEdge(x: number): { nearColEdge: boolean, colIndex: number } {
        let total = 0;
        for (let i = 0; i < this.gridMatrix.columnWidths.length; i++) {
            total += this.gridMatrix.columnWidths[i];
            if (Math.abs(x - total) < this.resizeThreshold) {
                return { nearColEdge: true, colIndex: i };
            }
        }
        return { nearColEdge: false, colIndex: -1 };
    }

    /**
     * Checks if the mouse is near a row edge and returns the edge information
     */
    isNearRowEdge(y: number): { nearRowEdge: boolean, rowIndex: number } {
        let total = 0;
        for (let i = 0; i < this.gridMatrix.rowHeights.length; i++) {
            total += this.gridMatrix.rowHeights[i];
            if (Math.abs(y - total) < this.resizeThreshold) {
                return { nearRowEdge: true, rowIndex: i };
            }
        }
        return { nearRowEdge: false, rowIndex: -1 };
    }

    /**
     * Converts pointer event coordinates to canvas-relative coordinates.
     */
    getMousePosition(e: PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const container = this.canvas.parentElement!;
        
        return {
            x: e.clientX - rect.left + container.scrollLeft,
            y: e.clientY - rect.top + container.scrollTop
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
                    ctx.fillText(cell.data, cell.x + cell.width / 2, cell.y + cell.height / 2);
                }
            }
        }
    }
}

class GridDataLoader {
    gridMatrix: GridMatrix;

    constructor(gridMatrix: GridMatrix) {
        this.gridMatrix = gridMatrix;
    }

    loadJSONData<T>(dataArray: T[]): void {
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            console.warn("No data to load.");
            return;
        }

        // 1. Get column names from the first object
        const columnNames = Object.keys(dataArray[0] as object);

        // 2. Write custom headers to row 1 (leave [0][*] as Excel style)
        for (let col = 0; col < columnNames.length; col++) {
            this.gridMatrix.grid[1][col + 1].data = columnNames[col];
        }

        // 3. Write data, starting from row 2
        for (let row = 0; row < dataArray.length; row++) {
            const dataObj = dataArray[row] as Record<string, any>;
            for (let col = 0; col < columnNames.length; col++) {
                let cellValue = dataObj[columnNames[col]];
                if (typeof cellValue === "object") {
                    let isArray = Array.isArray(cellValue);
                    if (isArray) {
                        cellValue = cellValue.join(", ");
                    } else {
                        cellValue = JSON.stringify(cellValue);
                    }
                }
                this.gridMatrix.grid[row + 2][col + 1].data = cellValue; // <-- row+2
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

    const resizer = new GridResizer(canvas, ctx, gridMatrix);
    const cellSelector = new CellSelector(canvas, ctx, gridMatrix);
    resizer.setCellSelector(cellSelector);

    // Make canvas focusable for keyboard events
    canvas.tabIndex = 0;
    canvas.focus();

    // 1. Create loader
    const gridDataLoader = new GridDataLoader(gridMatrix);

    // 2. Load sample data
    const sampleData = [
        { name: "Yolo", age: 34, hobbies: ["driving", "learning"] }
    ];
    gridDataLoader.loadJSONData(sampleData);

    // 3. Redraw grid to show new data
    cellSelector.redrawGrid();
};
