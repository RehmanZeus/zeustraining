import { DPR, MIN_GRIDCELL_WIDTH } from "../constants.js";
import { GridCell } from "./GridCell.js";
import { GridMatrix } from "./GridMatrix.js";

/**
 * CellSelector handles cell selection, highlighting, and input functionality
 * for the Excel-like grid interface. It manages the active cell state and
 * provides input capabilities similar to Excel.
 */
export class CellSelector {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    gridMatrix: GridMatrix;

    selectedRow = -1;
    selectedCol = -1;

    selectionStartRow = -1;
    selectionStartCol = -1;
    selectionEndRow = -1;
    selectionEndCol = -1;
    pointerDownPosition: { x: number, y: number } = { x: 0, y: 0 };

    // For shift-selection anchor
    anchorRow: number | null = null;
    anchorCol: number | null = null;

    selectedRangeCellData: { startRow: number, endRow: number, startCol: number, endCol: number } = {
        startRow: -1, endRow: -1, startCol: -1, endCol: -1
    };

    isDragging = false;
    dragStarted = false;
    suppressNextClick = false;

    inputElement!: HTMLInputElement;
    isEditing = false;
    selectionBorderColor = '#137e43';
    redrawGrid: () => void = () => { };

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;
        this.createInputElement();
    }

    /** Returns true if the pointer/mouse event is on a data cell */
    isCell(e: MouseEvent | PointerEvent): boolean {
        const { x, y } = this.getMousePosition(e);
        const { row, col } = this.getCellFromPosition(x, y);
        return row > 0 && col > 0 && row < this.gridMatrix.noOfRows && col < this.gridMatrix.noOfCols;
    }


    // --- Event handler methods for EventAttacher ---

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

    onPointerUp(e: PointerEvent) {
        if (this.isDragging) {
            this.isDragging = false;
            if (this.dragStarted) {
                this.suppressNextClick = true;
            }
            this.redrawGrid();
        }
    }

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
    }

    onDoubleClick(_e: MouseEvent) {
        if (this.selectedRow > 0 && this.selectedCol > 0) {
            this.startEditing();
        }
    }

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

    // Keyboard shortcuts for navigation and editing
    handleKeydown(e: KeyboardEvent) {
        if (this.isEditing) return;
        if (this.selectedRow === -1 || this.selectedCol === -1) return;

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
    handleShiftArrow(dRow: number, dCol: number) {
        // If not currently in range mode, start anchor at current cell
        if (
            this.selectionStartRow <= 0 || this.selectionStartCol <= 0 ||
            this.selectionEndRow <= 0 || this.selectionEndCol <= 0 || this.dragStarted
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

    handleInputKeydown(e: KeyboardEvent) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                this.finishEditing();
                this.moveSelection(1, 0);
                break;
            case 'Tab':
                e.preventDefault();
                alert("TAAA")
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

    moveSelection(rowOffset: number, colOffset: number) {
        const newRow = Math.max(1, Math.min(this.gridMatrix.noOfRows - 1, this.selectedRow + rowOffset));
        const newCol = Math.max(1, Math.min(this.gridMatrix.noOfCols - 1, this.selectedCol + colOffset));
        this.selectCell(newRow, newCol);
    }

    startEditing(initialValue?: string) {
        if (this.selectedRow <= 0 || this.selectedCol <= 0) return;

        const cell = this.gridMatrix.getCell(this.selectedRow, this.selectedCol);
        const canvasRect = this.canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;

        const exactLeft = canvasRect.left + cell.x - scrollLeft;
        const exactTop = canvasRect.top + cell.y - scrollTop;

        this.inputElement.style.position = 'absolute';
        this.inputElement.style.left = exactLeft + 'px';
        this.inputElement.style.top = exactTop + 'px';
        this.inputElement.style.width = cell.width + 'px';
        this.inputElement.style.height = cell.height + 'px';

        // Reset styles
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

    finishEditing() {
        if (!this.isEditing) return;
        const cell = this.gridMatrix.getCell(this.selectedRow, this.selectedCol);
        cell.data = this.inputElement.value;
        this.inputElement.style.display = 'none';
        this.isEditing = false;
        this.redrawGrid();
        this.canvas.focus();
    }

    cancelEditing() {
        if (!this.isEditing) return;
        this.inputElement.style.display = 'none';
        this.isEditing = false;
        this.canvas.focus();
    }

    clearSelectedCell() {
        if (this.selectedRow <= 0 || this.selectedCol <= 0) return;
        const cell = this.gridMatrix.getCell(this.selectedRow, this.selectedCol);
        cell.data = '';
        this.redrawGrid();
    }

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
            ctx.globalAlpha = 0.2;
            for (let row = minRow; row <= maxRow; row++) {
                for (let col = minCol; col <= maxCol; col++) {
                    if (row === minRow && col === minCol) continue;
                    const cell = this.gridMatrix.getCell(row, col);
                    ctx.fillStyle = '#caead8';
                    ctx.fillRect(cell.x - scrollLeft, cell.y - scrollTop, cell.width, cell.height);
                }
            }
            for (let col = minCol; col <= maxCol; col++) {
                const colHeader = this.gridMatrix.getCell(0, col);
                ctx.fillStyle = "#caead8"; // dark green for header (like column selector)
                ctx.fillRect(colHeader.x - scrollLeft, colHeader.y, colHeader.width, colHeader.height);
            }
            for (let row = minRow; row <= maxRow; row++) {
                const rowHeader = this.gridMatrix.getCell(row, 0);
                ctx.fillStyle = "#caead8"; // yellow for header (like row selector)
                ctx.fillRect(rowHeader.x, rowHeader.y - scrollTop, rowHeader.width, rowHeader.height);
            }
            ctx.globalAlpha = 1.0;

            // 2. Draw header text (white)
            for (let col = minCol; col <= maxCol; col++) {
                const colHeader = this.gridMatrix.getCell(0, col);
                ctx.font = "14px Arial";
                ctx.fillStyle = "#0f7d87";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(
                    colHeader.data || "",
                    colHeader.x + colHeader.width / 2 - scrollLeft,
                    colHeader.y + colHeader.height / 2
                );
            }
            for (let row = minRow; row <= maxRow; row++) {
                const rowHeader = this.gridMatrix.getCell(row, 0);
                ctx.font = "14px Arial";
                ctx.fillStyle = "#0f7d87";
                ctx.textAlign = "right";
                ctx.textBaseline = "bottom";
                ctx.fillText(
                    rowHeader.data || "",
                    rowHeader.x + rowHeader.width - 8,
                    rowHeader.y + rowHeader.height - 4 - scrollTop
                );
            }

            // 3. Draw thick header borders
            ctx.save();
            ctx.strokeStyle = "#107c41"; // green for column header bottom
            ctx.lineWidth = 2;
            for (let col = minCol; col <= maxCol; col++) {
                const colHeader = this.gridMatrix.getCell(0, col);
                ctx.beginPath();
                ctx.moveTo(colHeader.x - scrollLeft, colHeader.y + colHeader.height - 1);
                ctx.lineTo(colHeader.x - scrollLeft + colHeader.width, colHeader.y + colHeader.height - 1);
                ctx.stroke();
            }
            ctx.restore();

            ctx.save();
            ctx.strokeStyle = "#107c41";
            ctx.lineWidth = 2;
            for (let row = minRow; row <= maxRow; row++) {
                const rowHeader = this.gridMatrix.getCell(row, 0);
                ctx.beginPath();
                ctx.moveTo(rowHeader.x + rowHeader.width - 1, rowHeader.y - scrollTop);
                ctx.lineTo(rowHeader.x + rowHeader.width - 1, rowHeader.y + rowHeader.height - scrollTop);
                ctx.stroke();
            }
            ctx.restore();

            // 4. Draw border around the selection
            ctx.save();
            ctx.strokeStyle = this.selectionBorderColor;
            ctx.lineWidth = 2;
            const topLeft = this.gridMatrix.getCell(minRow, minCol);
            const bottomRight = this.gridMatrix.getCell(maxRow, maxCol);
            ctx.strokeRect(
                topLeft.x - scrollLeft, topLeft.y - scrollTop,
                (bottomRight.x + bottomRight.width) - topLeft.x,
                (bottomRight.y + bottomRight.height) - topLeft.y
            );
            ctx.restore();

            return;
        }
        // Otherwise, draw single cell highlight if available and not dragging
        if (this.selectedRow > 0 && this.selectedCol > 0) {
            const cell = this.gridMatrix.getCell(this.selectedRow, this.selectedCol);
            const header = this.gridMatrix.getCell(0, this.selectedCol);
            const row = this.gridMatrix.getCell(this.selectedRow, 0);

            // --- Highlight column header cell ---
            ctx.save();
            ctx.fillStyle = "#caead8";
            ctx.fillRect(header.x - scrollLeft, header.y - scrollTop, header.width, header.height);

            // Redraw column header text
            ctx.font = "14px Arial";
            ctx.fillStyle = "#616161";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                header.data || "",
                header.x + header.width / 2 - scrollLeft,
                header.y + header.height / 2 - scrollTop
            );
            // Draw bottom border for the column header
            if (this.selectedRow !== 1) {
                ctx.strokeStyle = this.selectionBorderColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(header.x - scrollLeft, header.y + header.height - 1 - scrollTop);
                ctx.lineTo(header.x + header.width - scrollLeft, header.y + header.height - 1 - scrollTop);
                ctx.stroke();
                ctx.restore();
            }

            // --- Highlight row header cell ---
            ctx.save();
            ctx.fillStyle = "#caead8";
            ctx.fillRect(row.x - scrollLeft, row.y - scrollTop, row.width, row.height);

            // Redraw row header text
            ctx.font = "14px Arial";
            ctx.fillStyle = "#616161";
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.fillText(
                row.data || "",
                row.x + row.width - 8 - scrollLeft,
                row.y + row.height - 4 - scrollTop
            );
            // Draw right border for the row header
            if (this.selectedCol !== 1) {
                ctx.strokeStyle = this.selectionBorderColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(row.x + row.width - 1 - scrollLeft, row.y - scrollTop);
                ctx.lineTo(row.x + row.width - 1 - scrollLeft, row.y + row.height - scrollTop);
                ctx.stroke();
                ctx.restore();
            }

            // --- Draw selection background for main cell ---
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.125)';
            ctx.fillRect(cell.x - scrollLeft, cell.y - scrollTop, cell.width, cell.height);

            // Draw selection border
            ctx.strokeStyle = this.selectionBorderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(cell.x - scrollLeft, cell.y - scrollTop, cell.width, cell.height);
            ctx.lineWidth = 1; // Reset line width
            ctx.restore();
        }
    }
    clearEditing() {
        if (this.isEditing) {
            this.cancelEditing();
        }
        this.selectedRow = -1;
        this.selectedCol = -1;
        this.clearRangeSelection?.();
        this.redrawGrid?.();
    }

    clearRangeSelection() {
        this.selectionStartRow = -1;
        this.selectionStartCol = -1;
        this.selectionEndRow = -1;
        this.selectionEndCol = -1;
        this.anchorRow = null;
        this.anchorCol = null;
    }

    setRedrawGridCallback(redrawFn: () => void) {
        this.redrawGrid = redrawFn;
    }

    getMousePosition(e: MouseEvent | PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        return {
            x: e.clientX - rect.left + container.scrollLeft,
            y: e.clientY - rect.top + container.scrollTop
        };
    }

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

    getSelectedCellData(): string | undefined {
        if (this.selectedRow <= 0 || this.selectedCol <= 0) return undefined;
        return this.gridMatrix.getCell(this.selectedRow, this.selectedCol).data;
    }

    getSelectedCellReference(): string {
        if (this.selectedRow <= 0 || this.selectedCol <= 0) return '';
        const colHeader = GridCell.generateHeader(this.selectedCol - 1);
        return `${colHeader}${this.selectedRow}`;
    }
}