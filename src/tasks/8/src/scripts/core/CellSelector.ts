import { DPR, MIN_GRIDCELL_WIDTH } from "../constants.js";
import { GridCell } from "./GridCell.js";
import { GridMatrix } from "./GridMatrix.js";

/**
 * CellSelector handles cell selection, highlighting, and input functionality
 * for the Excel-like grid interface. It manages the active cell state and
 * provides input capabilities similar to Excel.
 */
export class CellSelector {
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
    selectionBorderColor = '#137e43';
    redrawGrid: () => void = () => { };
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
        this.inputElement.style.border = '2px solid #137e43';
        this.inputElement.style.outline = 'none';
        this.inputElement.style.fontFamily = 'Arial';
        this.inputElement.style.fontSize = '14px'
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

        const cell = this.gridMatrix.getCell(this.selectedRow, this.selectedCol);;
        const canvasRect = this.canvas.getBoundingClientRect();

        // Correct: No scroll offsets if canvas is fixed
        const exactLeft = canvasRect.left + cell.x;
        const exactTop = canvasRect.top + cell.y;

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

        this.inputElement.value = initialValue !== undefined ? initialValue : (cell.data || '');

        this.inputElement.style.display = 'block';
        this.inputElement.focus();
        this.inputElement.select();
        this.isEditing = true;


    }

    /**
     * Finishes editing and saves the value
     */
    finishEditing() {
        if (!this.isEditing) return;

        const cell = this.gridMatrix.getCell(this.selectedRow, this.selectedCol);
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

        const cell = this.gridMatrix.getCell(this.selectedRow, this.selectedCol);;
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
            console.log(totalX)
            if (x < totalX) {
                col = i;
                console.log(col);
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

        const cell = this.gridMatrix.getCell(this.selectedRow, this.selectedCol);

        // Draw selection background
        ctx.fillStyle = 'rgba(255,255,255,0.125)'; // 12.5% opacity
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
    setRedrawGridCallback(redrawFn: () => void) {
        this.redrawGrid = redrawFn;
    }

    /**
     * Converts mouse event coordinates to canvas-relative coordinates
     */
    getMousePosition(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    /**
     * Gets the currently selected cell data
     */
    getSelectedCellData(): string | undefined {
        if (this.selectedRow <= 0 || this.selectedCol <= 0) return undefined;
        return this.gridMatrix.getCell(this.selectedRow, this.selectedCol).data;
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
