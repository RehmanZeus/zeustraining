import { DPR, MIN_GRIDCELL_WIDTH } from "../constants.js";
import { GridCell } from "./GridCell.js";
import { GridMatrix } from "./GridMatrix.js";

/**
 * CellSelector handles cell selection, highlighting, and input functionality
 * for the Excel-like grid interface. It manages the active cell state and
 * provides input capabilities similar to Excel.
 */
export class CellSelector {

    /** The canvas element where the grid is drawn */
    canvas: HTMLCanvasElement;
    /** The 2D rendering context for the canvas */
    ctx: CanvasRenderingContext2D;
    /** The grid matrix containing all cells and their data */
    gridMatrix: GridMatrix;


    /** The currently selected row (1-based index) */
    selectedRow = -1;
    /** The currently selected column (1-based index) */
    selectedCol = -1;

    /** The starting row of the selection (1-based index) */
    selectionStartRow = -1;
    /** The starting column of the selection (1-based index) */
    selectionStartCol = -1;
    /** The ending row of the selection (1-based index) */
    selectionEndRow = -1;
    /** The ending column of the selection (1-based index) */
    selectionEndCol = -1;
    /** The position where the pointer was pressed down */
    pointerDownPosition: { x: number, y: number } = { x: 0, y: 0 };

    /** The row and column where the selection anchor is set */
    anchorRow: number | null = null;
    /** The column where the selection anchor is set */
    anchorCol: number | null = null;

    /** The currently selected range of cells */
    selectedRangeCellData: { startRow: number, endRow: number, startCol: number, endCol: number } = {
        startRow: -1, endRow: -1, startCol: -1, endCol: -1
    };

    /** Indicates if the user is currently dragging to select cells */
    isDragging = false;
    /** Indicates if the drag operation has started */
    dragStarted = false;
    /** Indicates if the next click should be suppressed to avoid conflicts with drag */
    suppressNextClick = false;



    /** The input element used for editing cell data */
    inputElement!: HTMLInputElement;
    /** Indicates if the input element is currently focused */
    isEditing = false;
    /** The color used for the selection border */
    selectionBorderColor = '#137e43';
    /** The function to redraw the grid, set by the parent component */
    redrawGrid: () => void = () => { };

    onCellEdit?: (value: string) => void;
    onCellEditFinish?: (value: string) => void;

    /**
     * 
     * @param canvas The canvas element where the grid is drawn.
     * @param ctx The 2D rendering context for the canvas.
     * @param gridMatrix The grid matrix containing all cells and their data.
     */
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;
        this.createInputElement();
    }

    /**
     * Checks if the pointer/mouse event is on a data cell.
     * @param e The mouse or pointer event to check.
     * @returns True if the event is on a data cell, false otherwise.
     */
    isCell(e: MouseEvent | PointerEvent): boolean {
        const { x, y } = this.getMousePosition(e);
        const { row, col } = this.getCellFromPosition(x, y);
        return row > 0 && col > 0 && row < this.gridMatrix.noOfRows && col < this.gridMatrix.noOfCols;
    }


    /**
     * Handles the pointer down event to initiate cell selection.   
     * @param e The mouse or pointer event to get the position from.
     * @returns void
     */
    onPointerDown(e: PointerEvent) {
        if (e.button !== 0) return;
        this.pointerDownPosition = { x: e.clientX, y: e.clientY };
        this.dragStarted = false;

        const { x, y } = this.getMousePosition(e);
        const { row, col } = this.getCellFromPosition(x, y);
        if (row > 0 && col > 0) {
            this.isDragging = true;
            this.selectionStartRow = row;
            this.selectionStartCol = col;
            this.selectionEndRow = row;
            this.selectionEndCol = col;
            // don't clear selection yet
            this.anchorRow = row;
            this.anchorCol = col;
        }
    }

    /**
     * Handles the pointer move event to update the cell selection.
     * @param e The mouse or pointer event to get the position from.
     * @returns void
     */
    onPointerMove(e: PointerEvent) {
        if (!this.isDragging) return;
        if (!this.dragStarted) {
            const dx = Math.abs(e.clientX - this.pointerDownPosition.x);
            const dy = Math.abs(e.clientY - this.pointerDownPosition.y);
            if (dx > 3 || dy > 3) {
                this.dragStarted = true;
                this.selectedRow = -1;
                this.selectedCol = -1;
            }
        }
        const { x, y } = this.getMousePosition(e);
        const { row, col } = this.getCellFromPosition(x, y);
        if (row > 0 && col > 0) {
            this.selectionEndRow = row;
            this.selectionEndCol = col;
            this.redrawGrid();
        }
    }


    /**
     * Handles the pointer up event to finalize cell selection.
     * @param e The mouse or pointer event to get the position from.
     * @returns void
     */
    onPointerUp(e: PointerEvent) {
        if (this.isDragging) {
            this.isDragging = false;
            if (this.dragStarted) {
                this.suppressNextClick = true;
            }
            this.dragStarted = false; // <-- Add this!
            this.redrawGrid();
        }
    }

    /**
     * Handles the click event to select a cell.
     * @param e The mouse event to get the position from.
     * @returns void
     */
    onClick(e: MouseEvent) {
        if (this.suppressNextClick) {
            this.suppressNextClick = false;
            return;
        }
        if (this.canvas.style.cursor === 'col-resize' || this.canvas.style.cursor === 'row-resize') {
            return;
        }
        const { x, y } = this.getMousePosition(e);
        const { row, col } = this.getCellFromPosition(x, y);

        if (row > 0 && col > 0 && row < this.gridMatrix.noOfRows && col < this.gridMatrix.noOfCols) {
            this.clearRangeSelection();
            this.selectCell(row, col);
        }
        console.log(this.selectedRow, this.selectedCol)
    }

    /**
     * Handles the double click event to start editing a cell.
     * @param _e The mouse event to get the position from.
     * @returns void
     */
    onDoubleClick(_e: MouseEvent) {
        if (this.selectedRow > 0 && this.selectedCol > 0) {
            this.startEditing();
        }
    }

    /**
     * Creates the input element for editing cell data.
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
        this.inputElement.addEventListener('input', () => {
            if (this.onCellEdit) this.onCellEdit(this.inputElement.value);
        });
    }

    /**
     * Handles keyboard events for cell navigation and editing.
     * @param e The keyboard event to handle.
     * @returns void
     */
    handleKeydown(e: KeyboardEvent) {
        if (this.isEditing) return;
        if ((this.selectedRow === -1 || this.selectedCol === -1) && (this.selectionStartRow == -1 && this.selectionStartCol == -1)) return;

        const shift = e.shiftKey;

        if (shift) {
            // --- Shift+Arrow: expand/shrink selection range ---
            let dRow = 0, dCol = 0;
            switch (e.key) {
                case 'ArrowUp': dRow = -1; break;
                case 'ArrowDown': dRow = 1; break;
                case 'ArrowLeft': dCol = -1; break;
                case 'ArrowRight': dCol = 1; break;
                default: break;
            }
            if (dRow !== 0 || dCol !== 0) {
                e.preventDefault();
                this.handleShiftArrow(dRow, dCol);
                return;
            }
        }

        // --- Normal navigation ---
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.moveSelection(-1, 0);
                break;
            case 'ArrowDown':
            case 'Enter':
                e.preventDefault();
                console.log(this.selectedRow, this.selectedCol)
                if (this.isEditing) {
                    console.log("yolo", this.selectedRow, this.selectedCol)
                    this.moveSelection(-1, 0);
                } else {
                    console.log("fkkaf", this.selectedRow, this.selectedCol)
                    this.moveSelection(1, 0);

                }
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
            case 'Escape':
                e.preventDefault();
                this.clearRangeSelection();
                this.redrawGrid();
                break;
            default:
                if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    this.startEditing(e.key);
                }
                break;
        }
    }

    /**
     * Handles the Shift+Arrow key event to expand or shrink the selection range.
     * @param dRow The change in row direction (-1 or 1).
     * @param dCol The change in column direction (-1 or 1).
     */
    handleShiftArrow(dRow: number, dCol: number) {
        // If not currently in range mode, start anchor at current cell
        if (
            this.selectionStartRow <= 0 || this.selectionStartCol <= 0 ||
            this.selectionEndRow <= 0 || this.selectionEndCol <= 0
        ) {
            this.anchorRow = this.selectedRow;
            this.anchorCol = this.selectedCol;
            this.selectionStartRow = this.anchorRow;
            this.selectionStartCol = this.anchorCol;
            this.selectionEndRow = this.anchorRow;
            this.selectionEndCol = this.anchorCol;
        }

        // Expand end in the requested direction
        let newEndRow = this.selectionEndRow + dRow;
        let newEndCol = this.selectionEndCol + dCol;
        newEndRow = Math.max(1, Math.min(this.gridMatrix.noOfRows - 1, newEndRow));
        newEndCol = Math.max(1, Math.min(this.gridMatrix.noOfCols - 1, newEndCol));

        this.selectionEndRow = newEndRow;
        this.selectionEndCol = newEndCol;

        // When dragging with shift, don't move the selected cell, just update the range.
        this.selectedRow = this.selectionEndRow;
        this.selectedCol = this.selectionEndCol;

        this.redrawGrid();
    }

    /**
     * 
     * @param e The keyboard event to handle.
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
                this.clearRangeSelection();
                this.redrawGrid();
                break;
        }
    }

    /**
     * Selects a cell in the grid.
     * @param row The row index of the cell to select.
     * @param col The column index of the cell to select.
     */
    selectCell(row: number, col: number) {
        if (this.isEditing) {
            this.finishEditing();
        }
        this.selectedRow = row;
        this.selectedCol = col;
        this.anchorRow = null;
        this.anchorCol = null;
        this.clearRangeSelection();
        this.redrawGrid();
    }

    /**
     * Moves the selection by the given row and column offsets.
     * @param rowOffset The number of rows to move the selection (can be negative).
     * @param colOffset The number of columns to move the selection (can be negative).
     */
    moveSelection(rowOffset: number, colOffset: number) {
        console.log("Move selection", rowOffset, colOffset)
        const newRow = Math.max(1, Math.min(this.gridMatrix.noOfRows - 1, this.selectedRow + rowOffset));
        const newCol = Math.max(1, Math.min(this.gridMatrix.noOfCols - 1, this.selectedCol + colOffset));
        console.log("move selection", newRow, newCol)
        this.selectCell(newRow, newCol);
    }

    /**
     * Starts editing the selected cell.
     * @param initialValue Optional initial value to set in the input element.
     * @returns void
     */
    startEditing(initialValue?: string) {
        if (this.selectedRow <= 0 || this.selectedCol <= 0) return;

        const cell = this.gridMatrix.getCell(this.selectedRow, this.selectedCol);
        const { x, y, width, height } = GridCell.getCellRect(
            this.selectedRow, this.selectedCol,
            this.gridMatrix.rowHeights, this.gridMatrix.columnWidths
        );
        const canvasRect = this.canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;

        const exactLeft = canvasRect.left + x - scrollLeft;
        const exactTop = canvasRect.top + y - scrollTop;

        this.inputElement.style.position = 'absolute';
        this.inputElement.style.left = exactLeft + 'px';
        this.inputElement.style.top = exactTop + 'px';
        this.inputElement.style.width = width + 'px';
        this.inputElement.style.height = height + 'px';

        // Reset styles
        this.inputElement.style.transform = 'none';
        this.inputElement.style.margin = '0';
        this.inputElement.style.padding = '0 4px';
        this.inputElement.style.display = 'block';
        this.inputElement.style.textAlign = "center";
        this.inputElement.style.fontSize = '14px';
        this.inputElement.style.fontFamily = 'Arial';
        this.inputElement.style.lineHeight = height + 'px';
        this.inputElement.style.boxSizing = 'border-box';

        this.inputElement.value = initialValue !== undefined ? initialValue : (cell.data || '');

        this.inputElement.style.display = 'block';
        this.inputElement.focus();
        this.isEditing = true;

        if (this.onCellEdit) this.onCellEdit(this.inputElement.value);
    }

    /**
     * Finishes editing the selected cell and saves the new value.
     * @returns void
     */
    finishEditing() {
        if (!this.isEditing) return;
        const cell = this.gridMatrix.getCell(this.selectedRow, this.selectedCol);
        cell.data = this.inputElement.value;
        this.inputElement.style.display = 'none';
        this.isEditing = false;
        console.log("Finish edit", this.selectedRow, this.selectedCol)
        this.redrawGrid();
        this.canvas.focus();
        if (this.onCellEditFinish) this.onCellEditFinish(this.inputElement.value);
    }


    /**
     * Cancels the current editing session and hides the input element.
     * @returns void
     */
    cancelEditing() {
        if (!this.isEditing) return;
        this.inputElement.style.display = 'none';
        this.isEditing = false;
        this.canvas.focus();
    }

    /**
     * Clears the current range selection.
     */
    clearSelectedCell() {
        if (this.selectedRow <= 0 || this.selectedCol <= 0) return;
        const cell = this.gridMatrix.getCell(this.selectedRow, this.selectedCol);
        cell.data = '';
        this.redrawGrid();
    }

    /**
     * Gets the cell coordinates from the mouse position.
     * @param x The x-coordinate of the mouse position.
     * @param y The y-coordinate of the mouse position.
     * @returns The row and column indices of the cell.
     */
    getCellFromPosition(x: number, y: number): { row: number, col: number } {
        let totalX = 0;
        let totalY = 0;
        let row = -1;
        let col = -1;
        for (let i = 0; i < this.gridMatrix.columnWidths.length; i++) {
            totalX += this.gridMatrix.columnWidths[i];
            if (x < totalX) {
                col = i;
                break;
            }
        }
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
     * Draws the selection rectangle on the canvas.
     * @param ctx The canvas rendering context to draw on.
     * @param scrollLeft The amount of horizontal scrolling.
     * @param scrollTop The amount of vertical scrolling.
     * @returns void
     */
    drawSelection(ctx: CanvasRenderingContext2D, scrollLeft = 0, scrollTop = 0) {
        // If a range selection is present, draw the range highlight
        if (
            this.selectionStartRow > 0 && this.selectionStartCol > 0 &&
            this.selectionEndRow > 0 && this.selectionEndCol > 0 &&
            (this.selectionStartRow !== this.selectionEndRow || this.selectionStartCol !== this.selectionEndCol)
        ) {
            let minRow = Math.min(this.selectionStartRow, this.selectionEndRow);
            let maxRow = Math.max(this.selectionStartRow, this.selectionEndRow);
            let minCol = Math.min(this.selectionStartCol, this.selectionEndCol);
            let maxCol = Math.max(this.selectionStartCol, this.selectionEndCol);

            // 1. Fill selection cells and headers background
            ctx.save();
            ctx.globalAlpha = 0.3;
            for (let row = minRow; row <= maxRow; row++) {
                for (let col = minCol; col <= maxCol; col++) {
                    if (row === minRow && col === minCol) continue;
                    const { x, y, width, height } = GridCell.getCellRect(
                        row, col,
                        this.gridMatrix.rowHeights,
                        this.gridMatrix.columnWidths
                    );
                    ctx.fillStyle = '#caead8';
                    ctx.fillRect(x - scrollLeft, y - scrollTop, width, height);
                }
            }
            for (let col = minCol; col <= maxCol; col++) {
                const { x, y, width, height } = GridCell.getCellRect(
                    0, col,
                    this.gridMatrix.rowHeights,
                    this.gridMatrix.columnWidths
                );
                ctx.fillStyle = "#caead8";
                ctx.fillRect(x - scrollLeft, y, width, height);
            }
            for (let row = minRow; row <= maxRow; row++) {
                const { x, y, width, height } = GridCell.getCellRect(
                    row, 0,
                    this.gridMatrix.rowHeights,
                    this.gridMatrix.columnWidths
                );
                ctx.fillStyle = "#caead8";
                ctx.fillRect(x, y - scrollTop, width, height);
            }
            ctx.globalAlpha = 1.0;

            // 2. Draw header text (white)
            for (let col = minCol; col <= maxCol; col++) {
                const colHeader = this.gridMatrix.getCell(0, col);
                const { x, y, width, height } = GridCell.getCellRect(
                    0, col,
                    this.gridMatrix.rowHeights,
                    this.gridMatrix.columnWidths
                );
                ctx.font = "14px Arial";
                ctx.fillStyle = "#0f7d87";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(
                    colHeader.data || "",
                    x + width / 2 - scrollLeft,
                    y + height / 2
                );
            }
            for (let row = minRow; row <= maxRow; row++) {
                const rowHeader = this.gridMatrix.getCell(row, 0);
                const { x, y, width, height } = GridCell.getCellRect(
                    row, 0,
                    this.gridMatrix.rowHeights,
                    this.gridMatrix.columnWidths
                );
                ctx.font = "14px Arial";
                ctx.fillStyle = "#0f7d87";
                ctx.textAlign = "right";
                ctx.textBaseline = "bottom";
                ctx.fillText(
                    rowHeader.data || "",
                    x + width - 8,
                    y + height - 4 - scrollTop
                );
            }

            // 3. Draw thick header borders
            ctx.save();
            ctx.strokeStyle = "#107c41";
            ctx.lineWidth = 2;
            for (let col = minCol; col <= maxCol; col++) {
                const { x, y, width, height } = GridCell.getCellRect(
                    0, col,
                    this.gridMatrix.rowHeights,
                    this.gridMatrix.columnWidths
                );
                ctx.beginPath();
                ctx.moveTo(x - scrollLeft, y + height - 1);
                ctx.lineTo(x - scrollLeft + width, y + height - 1);
                ctx.stroke();
            }
            ctx.restore();

            ctx.save();
            ctx.strokeStyle = "#107c41";
            ctx.lineWidth = 2;
            for (let row = minRow; row <= maxRow; row++) {
                const { x, y, width, height } = GridCell.getCellRect(
                    row, 0,
                    this.gridMatrix.rowHeights,
                    this.gridMatrix.columnWidths
                );
                ctx.beginPath();
                ctx.moveTo(x + width - 1, y - scrollTop);
                ctx.lineTo(x + width - 1, y + height - scrollTop);
                ctx.stroke();
            }
            ctx.restore();

            // 4. Draw border around the selection
            ctx.save();
            ctx.strokeStyle = this.selectionBorderColor;
            ctx.lineWidth = 2;
            const { x: topLeftX, y: topLeftY } = GridCell.getCellRect(
                minRow, minCol,
                this.gridMatrix.rowHeights,
                this.gridMatrix.columnWidths
            );
            const { x: bottomRightX, y: bottomRightY, width: bottomRightW, height: bottomRightH } = GridCell.getCellRect(
                maxRow, maxCol,
                this.gridMatrix.rowHeights,
                this.gridMatrix.columnWidths
            );
            ctx.strokeRect(
                topLeftX - scrollLeft, topLeftY - scrollTop,
                (bottomRightX + bottomRightW) - topLeftX,
                (bottomRightY + bottomRightH) - topLeftY
            );
            ctx.restore();
            return;
        }
        // Otherwise, draw single cell highlight if available and not dragging
        if (this.selectedRow > 0 && this.selectedCol > 0) {
            const cell = this.gridMatrix.getCell(this.selectedRow, this.selectedCol);
            const header = this.gridMatrix.getCell(0, this.selectedCol);
            const row = this.gridMatrix.getCell(this.selectedRow, 0);

            const { x, y, width, height } = GridCell.getCellRect(
                this.selectedRow, this.selectedCol,
                this.gridMatrix.rowHeights,
                this.gridMatrix.columnWidths
            );
            const { x: hx, y: hy, width: hw, height: hh } = GridCell.getCellRect(
                0, this.selectedCol,
                this.gridMatrix.rowHeights,
                this.gridMatrix.columnWidths
            );
            const { x: rx, y: ry, width: rw, height: rh } = GridCell.getCellRect(
                this.selectedRow, 0,
                this.gridMatrix.rowHeights,
                this.gridMatrix.columnWidths
            );

            // --- Highlight column header cell ---
            ctx.save();
            ctx.fillStyle = "#caead8";
            ctx.fillRect(hx - scrollLeft, hy - scrollTop, hw, hh);

            // Redraw column header text
            ctx.font = "14px Arial";
            ctx.fillStyle = "#616161";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                header.data || "",
                hx + hw / 2 - scrollLeft,
                hy + hh / 2 - scrollTop
            );
            // Draw bottom border for the column header
            if (this.selectedRow !== 1) {
                ctx.strokeStyle = this.selectionBorderColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(hx - scrollLeft, hy + hh - 1 - scrollTop);
                ctx.lineTo(hx + hw - scrollLeft, hy + hh - 1 - scrollTop);
                ctx.stroke();
                ctx.restore();
            }

            // --- Highlight row header cell ---
            ctx.save();
            ctx.fillStyle = "#caead8";
            ctx.fillRect(rx - scrollLeft, ry - scrollTop, rw, rh);

            // Redraw row header text
            ctx.font = "14px Arial";
            ctx.fillStyle = "#616161";
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.fillText(
                row.data || "",
                rx + rw - 8 - scrollLeft,
                ry + rh - 4 - scrollTop
            );
            // Draw right border for the row header
            if (this.selectedCol !== 1) {
                ctx.strokeStyle = this.selectionBorderColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(rx + rw - 1 - scrollLeft, ry - scrollTop);
                ctx.lineTo(rx + rw - 1 - scrollLeft, ry + rh - scrollTop);
                ctx.stroke();
                ctx.restore();
            }

            // --- Draw selection background for main cell ---
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.125)';
            ctx.fillRect(x - scrollLeft, y - scrollTop, width, height);

            // Draw selection border
            ctx.strokeStyle = this.selectionBorderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x - scrollLeft, y - scrollTop, width, height);
            ctx.lineWidth = 1; // Reset line width
            ctx.restore();
        }
    }

    /**
     * Clears the current editing session.
     */
    clearEditing() {
        if (this.isEditing) {
            this.cancelEditing();
        }
        this.selectedRow = -1;
        this.selectedCol = -1;
        this.clearRangeSelection?.();
        this.redrawGrid?.();
    }

    /**
     * Clears the current range selection.
     */
    clearRangeSelection() {
        this.selectionStartRow = -1;
        this.selectionStartCol = -1;
        this.selectionEndRow = -1;
        this.selectionEndCol = -1;
        this.anchorRow = null;
        this.anchorCol = null;
    }

    /**
     * Sets the redraw grid callback function.
     * @param redrawFn The function to call when the grid needs to be redrawn.
     */
    setRedrawGridCallback(redrawFn: () => void) {
        this.redrawGrid = redrawFn;
    }

    /**
     * Gets the mouse position relative to the canvas.
     * @param e The mouse or pointer event to get the position from.
     * @returns An object with x and y coordinates relative to the canvas.
     */
    getMousePosition(e: MouseEvent | PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        return {
            x: e.clientX - rect.left + container.scrollLeft,
            y: e.clientY - rect.top + container.scrollTop
        };
    }

    /**
     * 
     * @returns An object containing the start and end row/column of the selected range.
     *          Returns undefined if no valid selection is made.
     */
    getRangeSelectionData(): {
        startRow: number,
        endRow: number,
        startCol: number,
        endCol: number
    } | undefined {
        if (this.selectionStartRow <= -1 || this.selectionStartCol <= -1 || this.selectionEndRow <= -1 || this.selectionEndCol <= -1) {
            return undefined;
        }
        this.selectedRangeCellData = {
            startRow: this.selectionStartRow,
            endRow: this.selectionEndRow,
            startCol: this.selectionStartCol,
            endCol: this.selectionEndCol,
        };
        return this.selectedRangeCellData;
    }

    /**
     * 
     * @returns The data of the currently selected cell, or undefined if no cell is selected.
     *          Returns undefined if the selected cell is not valid (row/col <= 0
     */
    getSelectedCellData(): string | undefined {
        if (this.selectedRow <= 0 || this.selectedCol <= 0) return undefined;
        return this.gridMatrix.getCell(this.selectedRow, this.selectedCol).data;
    }



    /**
     * 
     * @returns The reference of the currently selected cell in A1 notation (e.g., "A1", "B2").
     *          Returns an empty string if no valid cell is selected (row/col <= 0).
     */
    getSelectedCellReference(): string {
        if (this.selectedRow <= 0 || this.selectedCol <= 0) return '';
        const colHeader = GridCell.generateHeader(this.selectedCol - 1);
        return `${colHeader}${this.selectedRow}`;
    }
}