import { Cell } from "../helpers/autoscroll/Cell.js";
import { ColumnSelector } from "./ColumnSelector.js";
import { CellEditCommand } from "./commands/CellEditCommand.js";
import { CommandManager } from "./commands/CommandManager.js";
import { GridCell } from "./GridCell.js";
import { GridMatrix } from "./GridMatrix.js";
import { RowSelector } from "./RowSelector.js";

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




    /** The input element used for editing cell data */
    inputElement!: HTMLInputElement;
    /** Indicates if the input element is currently focused */
    isEditing = false;
    /** The color used for the selection border */
    selectionBorderColor = '#137e43';

    commandManager?: CommandManager;

    colSelector?: ColumnSelector;

    rowSelector?: RowSelector;

    cellAutoScroll?: Cell;




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
        if (this.colSelector && this.colSelector.isColumnHeader(e)) return false;
        if (this.rowSelector && this.rowSelector.isRowHeader(e)) return false;
        return row > 0 && col > 0 && row < this.gridMatrix.noOfRows && col < this.gridMatrix.noOfCols;
    }


    setCommangManager(cm: CommandManager) {
        this.commandManager = cm;
    }


    setCellAutoScroll(c: Cell) {
        this.cellAutoScroll = c;
    }



    setColumnSelector(c: ColumnSelector) {
        this.colSelector = c;
    }

    setRowSelector(r: RowSelector) {
        this.rowSelector = r;
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
        this.inputElement.style.textAlign = 'left';

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

        if (this.anchorRow !== null && this.anchorCol !== null && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            this.selectedRow = this.anchorRow;
            this.selectedCol = this.anchorCol;
            const gridData = this.gridMatrix.getCell(this.anchorRow, this.anchorCol);
            this.startEditing(gridData.data);
        }

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

                if (this.isEditing) {

                    this.moveSelection(-1, 0);
                } else {
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
                    e.preventDefault();
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

        if (this.cellAutoScroll) {
            this.cellAutoScroll.scrollSelectionIntoView(this.selectionEndRow, this.selectionEndCol);

        }
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
    * Selects a cell in the grid and scrolls to it if needed.
    * @param row The row index of the cell to select.
    * @param col The column index of the cell to select.
    */
    selectCell(row: number, col: number, smooth = false) {
        if (this.isEditing) this.finishEditing();
        this.selectedRow = row;
        this.selectedCol = col;
        this.anchorRow = null;
        this.anchorCol = null;
        this.clearRangeSelection();

        const container = document.getElementById('excel-container') as HTMLDivElement;
        const cellRect = GridCell.getCellRect(row, col, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);
        const stickyHeaderHeight = this.gridMatrix.rowHeights[0];
        const stickyColWidth = this.gridMatrix.columnWidths[0];
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;
        const visibleLeft = scrollLeft + stickyColWidth;
        const visibleTop = scrollTop + stickyHeaderHeight;
        const visibleRight = scrollLeft + viewportWidth;
        const visibleBottom = scrollTop + viewportHeight;

        let newScrollLeft = scrollLeft;
        let newScrollTop = scrollTop;

        if (cellRect.x < visibleLeft) {
            newScrollLeft = cellRect.x - stickyColWidth;
        } else if (cellRect.x + cellRect.width > visibleRight) {
            newScrollLeft = cellRect.x + cellRect.width - viewportWidth;
        }
        if (cellRect.y < visibleTop) {
            newScrollTop = cellRect.y - stickyHeaderHeight;
        } else if (cellRect.y + cellRect.height > visibleBottom) {
            newScrollTop = cellRect.y + cellRect.height - viewportHeight;
        }
        newScrollLeft = Math.max(newScrollLeft, 0);
        newScrollTop = Math.max(newScrollTop, 0);

        if (newScrollLeft !== scrollLeft || newScrollTop !== scrollTop) {
            container.scrollTo({
                left: newScrollLeft,
                top: newScrollTop,
                behavior: 'instant'
            });
            // Wait for scroll to be applied, then redraw!
            requestAnimationFrame(() => {
                this.redrawGrid();
            });
        } else {
            this.redrawGrid();
        }
    }


    /**
     * Moves the selection by the given row and column offsets.
     * @param rowOffset The number of rows to move the selection (can be negative).
     * @param colOffset The number of columns to move the selection (can be negative).
     */
    moveSelection(rowOffset: number, colOffset: number) {
        const newRow = Math.max(1, Math.min(this.gridMatrix.noOfRows - 1, this.selectedRow + rowOffset));
        const newCol = Math.max(1, Math.min(this.gridMatrix.noOfCols - 1, this.selectedCol + colOffset));
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
        this.inputElement.style.textAlign = "left";
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
        this.commandManager?.executeCommand(
            new CellEditCommand(cell, this, cell.data ? cell.data : "", this.inputElement.value)
        )
        this.inputElement.style.display = 'none';
        this.isEditing = false;
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
    drawSelection(
        ctx: CanvasRenderingContext2D,
        scrollLeft = 0,
        scrollTop = 0,
        suppressHeaderSelection: boolean = false
    ) {
        if (this.hasRangeSelection()) {
            this.drawRangeHighlight(ctx, scrollLeft, scrollTop, suppressHeaderSelection);
            return;
        }
        if (this.hasSingleCellSelection()) {
            this.drawSingleCellHighlight(ctx, scrollLeft, scrollTop, suppressHeaderSelection);
        }
    }

    hasRangeSelection() {
        return (
            this.selectionStartRow > 0 && this.selectionStartCol > 0 &&
            this.selectionEndRow > 0 && this.selectionEndCol > 0 &&
            (this.selectionStartRow !== this.selectionEndRow || this.selectionStartCol !== this.selectionEndCol)
        );
    }

    hasSingleCellSelection() {
        return this.selectedRow > 0 && this.selectedCol > 0;
    }

    drawRangeHighlight(
        ctx: CanvasRenderingContext2D,
        scrollLeft: number,
        scrollTop: number,
        suppressHeaderSelection: boolean
    ) {
        let minRow = Math.min(this.selectionStartRow, this.selectionEndRow);
        let maxRow = Math.max(this.selectionStartRow, this.selectionEndRow);
        let minCol = Math.min(this.selectionStartCol, this.selectionEndCol);
        let maxCol = Math.max(this.selectionStartCol, this.selectionEndCol);

        ctx.save();
        ctx.globalAlpha = 0.3;
        this.fillRangeCells(ctx, minRow, maxRow, minCol, maxCol, scrollLeft, scrollTop);
        if (!suppressHeaderSelection) {
            this.fillRangeColumnHeaders(ctx, minCol, maxCol, scrollLeft);
            this.fillRangeRowHeaders(ctx, minRow, maxRow, scrollTop);
        }

        ctx.globalAlpha = 1.0;

        if (!suppressHeaderSelection) {
            this.drawRangeHeaderTexts(ctx, minCol, maxCol, scrollLeft);
            this.drawRangeRowHeaderTexts(ctx, minRow, maxRow, scrollTop);
        }


        if (!suppressHeaderSelection) {
            this.drawRangeHeaderBorders(ctx, minCol, maxCol, scrollLeft);
            this.drawRangeRowBorders(ctx, minRow, maxRow, scrollTop);
        }


        this.drawRangeSelectionBorder(ctx, minRow, maxRow, minCol, maxCol, scrollLeft, scrollTop);
    }

    fillRangeCells(
        ctx: CanvasRenderingContext2D,
        minRow: number, maxRow: number,
        minCol: number, maxCol: number,
        scrollLeft: number, scrollTop: number
    ) {
        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                if (row === this.anchorRow && col === this.anchorCol) continue;
                const { x, y, width, height } = GridCell.getCellRect(
                    row, col,
                    this.gridMatrix.rowHeights,
                    this.gridMatrix.columnWidths
                );
                ctx.fillStyle = '#caead8';
                ctx.fillRect(x - scrollLeft, y - scrollTop, width, height);
            }
        }
    }

    fillRangeColumnHeaders(
        ctx: CanvasRenderingContext2D,
        minCol: number, maxCol: number,
        scrollLeft: number
    ) {
        for (let col = minCol; col <= maxCol; col++) {
            const { x, y, width, height } = GridCell.getCellRect(
                0, col,
                this.gridMatrix.rowHeights,
                this.gridMatrix.columnWidths
            );
            ctx.fillStyle = "#caead8";
            ctx.fillRect(x - scrollLeft, y, width, height);
        }
    }

    fillRangeRowHeaders(
        ctx: CanvasRenderingContext2D,
        minRow: number, maxRow: number,
        scrollTop: number
    ) {
        for (let row = minRow; row <= maxRow; row++) {
            const { x, y, width, height } = GridCell.getCellRect(
                row, 0,
                this.gridMatrix.rowHeights,
                this.gridMatrix.columnWidths
            );
            ctx.fillStyle = "#caead8";
            ctx.fillRect(x, y - scrollTop, width, height);
        }
    }

    drawRangeHeaderTexts(
        ctx: CanvasRenderingContext2D,
        minCol: number, maxCol: number,
        scrollLeft: number
    ) {
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
    }

    drawRangeRowHeaderTexts(
        ctx: CanvasRenderingContext2D,
        minRow: number, maxRow: number,
        scrollTop: number
    ) {
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
    }

    drawRangeHeaderBorders(
        ctx: CanvasRenderingContext2D,
        minCol: number, maxCol: number,
        scrollLeft: number
    ) {
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
    }

    drawRangeRowBorders(
        ctx: CanvasRenderingContext2D,
        minRow: number, maxRow: number,
        scrollTop: number
    ) {
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
    }

    drawRangeSelectionBorder(
        ctx: CanvasRenderingContext2D,
        minRow: number, maxRow: number,
        minCol: number, maxCol: number,
        scrollLeft: number, scrollTop: number
    ) {
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
    }

    drawSingleCellHighlight(
        ctx: CanvasRenderingContext2D,
        scrollLeft: number,
        scrollTop: number,
        suppressHeaderSelection: boolean = false
    ) {
        const headerHeight = this.gridMatrix.rowHeights[0];
        const headerWidth = this.gridMatrix.columnWidths[0];

        // Cell coordinates
        const { x, y, width, height } = GridCell.getCellRect(
            this.selectedRow, this.selectedCol,
            this.gridMatrix.rowHeights,
            this.gridMatrix.columnWidths
        );

        // Clip to grid body (exclude both top header and left header)
        ctx.save();
        ctx.beginPath();
        ctx.rect(
            headerWidth,           // left
            headerHeight,          // top
            ctx.canvas.width - headerWidth,   // width
            ctx.canvas.height - headerHeight  // height
        );
        ctx.clip();

        // Draw selection border/background
        ctx.fillStyle = 'rgba(255,255,255,0.125)';
        ctx.fillRect(x - scrollLeft, y - scrollTop, width, height);

        ctx.strokeStyle = this.selectionBorderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - scrollLeft, y - scrollTop, width, height);

        ctx.restore();

        // Optionally, still highlight the header cells as before
       
    }

    highlightSingleColumnHeader(
        ctx: CanvasRenderingContext2D,
        hx: number, hy: number, hw: number, hh: number,
        header: GridCell,
        scrollLeft: number, scrollTop: number
    ) {
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
        ctx.restore();

        // Draw bottom selection border OVER the header (always)
        ctx.save();
        ctx.strokeStyle = this.selectionBorderColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx - scrollLeft, hy + hh - 1 - scrollTop);
        ctx.lineTo(hx + hw - scrollLeft, hy + hh - 1 - scrollTop);
        ctx.stroke();
        ctx.restore();
    }

    highlightSingleRowHeader(
        ctx: CanvasRenderingContext2D,
        rx: number, ry: number, rw: number, rh: number,
        row: any,
        scrollLeft: number, scrollTop: number
    ) {
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
        }
        ctx.restore();
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

    getSelectedCell(): {
        cell: GridCell,
        cellBounds: {
            x: number;
            y: number;
            width: number;
            height: number;
        }
    } | null {
        if (this.selectedRow <= 0 || this.selectedCol <= 0) return null;
        const cell = this.gridMatrix.getCell(this.selectedRow, this.selectedCol);
        const cellBounds = GridCell.getCellRect(this.selectedRow, this.selectedCol, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);
        return { cell, cellBounds };
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

}