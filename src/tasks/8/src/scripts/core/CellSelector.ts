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

    /** Drag selection coordinates */
    selectionStartRow = -1;
    selectionStartCol = -1;
    selectionEndRow = -1;
    selectionEndCol = -1;
    pointerDownPosition: { x: number, y: number } = {
        x: 0,
        y: 0
    };

    selectedRangeCellData: { startRow: number, endRow: number, startCol: number, endCol: number, data: any[] } = {
        startRow: -1,
        endRow: -1,
        startCol: -1,
        endCol: -1,
        data: []
    };

    /** Dragging state */
    isDragging = false;
    dragStarted = false;
    suppressNextClick = false;

    /** Input element for cell editing */
    inputElement!: HTMLInputElement;

    /** Flag to track if currently editing */
    isEditing = false;

    /** Selection highlight color */
    selectionBorderColor = '#137e43';
    redrawGrid: () => void = () => { };

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;

        this.createInputElement();
        this.attachEvents();
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

    attachEvents() {
        this.canvas.addEventListener('click', this.handleCellClick.bind(this));
        this.canvas.addEventListener('dblclick', this.handleCellDoubleClick.bind(this));
        this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
        this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    handlePointerDown(e: PointerEvent) {
        if (e.button !== 0) return;
        this.pointerDownPosition = { x: e.clientX, y: e.clientY }; // save for drag threshold
        this.dragStarted = false;

        // prepare for potential drag
        const { x, y } = this.getMousePosition(e as any);
        const { row, col } = this.getCellFromPosition(x, y);
        if (row > 0 && col > 0) {
            this.isDragging = true;
            console.log(this.getRangeSelectionData());
            this.selectionStartRow = row;
            this.selectionStartCol = col;
            this.selectionEndRow = row;
            this.selectionEndCol = col;
            // don't clear selection yet
        }
    }

    handlePointerMove(e: PointerEvent) {
        if (!this.isDragging) return;
        // Only flag as drag if moved a bit
        if (!this.dragStarted) {
            const dx = Math.abs(e.clientX - this.pointerDownPosition.x);
            const dy = Math.abs(e.clientY - this.pointerDownPosition.y);
            if (dx > 3 || dy > 3) { // use a small threshold
                this.dragStarted = true;
                // Now clear single cell selection
                this.selectedRow = -1;
                this.selectedCol = -1;
            }
        }
        const { x, y } = this.getMousePosition(e as any);
        const { row, col } = this.getCellFromPosition(x, y);
        if (row > 0 && col > 0) {
            this.selectionEndRow = row;
            this.selectionEndCol = col;
            this.redrawGrid();
        }
    }
    handlePointerUp(e: PointerEvent) {
        if (this.isDragging) {
            this.isDragging = false;
            if (this.dragStarted) {
                this.suppressNextClick = true; // only if actual drag
            }
            this.redrawGrid();

        }
    }

    handleCellClick(e: MouseEvent) {
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
            console.log(this.getSelectedCellData())
        }
    }

    handleCellDoubleClick(e: MouseEvent) {
        if (this.selectedRow > 0 && this.selectedCol > 0) {
            this.startEditing();
        }
    }

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

    selectCell(row: number, col: number) {
        if (this.isEditing) {
            this.finishEditing();
        }
        this.selectedRow = row;
        this.selectedCol = col;
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

            ctx.save();
            ctx.strokeStyle = this.selectionBorderColor;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.2;
            for (let row = minRow; row <= maxRow; row++) {
                for (let col = minCol; col <= maxCol; col++) {
                    const cell = this.gridMatrix.getCell(row, col);
                    const rows = this.gridMatrix.getCell(0, col);
                    const cols = this.gridMatrix.getCell(row, 0);
                    ctx.fillStyle = '#b7e4c7';
                    ctx.fillRect(cell.x - scrollLeft, cell.y - scrollTop, cell.width, cell.height);
                    ctx.fillRect(rows.x - scrollLeft, rows.y - scrollTop, rows.width, rows.height);
                    ctx.fillRect(cols.x - scrollLeft, cols.y - scrollTop, cols.width, cols.height);
                }
            }
            ctx.globalAlpha = 1.0;
            // Draw border around the selection
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
            ctx.strokeStyle = this.selectionBorderColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(header.x - scrollLeft, header.y + header.height - 1 - scrollTop);
            ctx.lineTo(header.x + header.width - scrollLeft, header.y + header.height - 1 - scrollTop);
            ctx.stroke();
            ctx.restore();

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
            ctx.strokeStyle = this.selectionBorderColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(row.x + row.width - 1 - scrollLeft, row.y - scrollTop);
            ctx.lineTo(row.x + row.width - 1 - scrollLeft, row.y + row.height - scrollTop);
            ctx.stroke();
            ctx.restore();

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
        this.redrawGrid();
    }

    clearRangeSelection() {
        this.selectionStartRow = -1;
        this.selectionStartCol = -1;
        this.selectionEndRow = -1;
        this.selectionEndCol = -1;
    }

    setRedrawGridCallback(redrawFn: () => void) {
        this.redrawGrid = redrawFn;
    }

    getMousePosition(e: MouseEvent) {
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
        endCol: number,
        data: any[]
    } | undefined {
        if (this.selectionStartRow <= -1 || this.selectionStartCol <= -1 || this.selectionEndRow <= -1 || this.selectionEndCol <= -1) {
            return undefined;
        }

        const data: any[] = [];
        this.selectedRangeCellData = {
            startRow: -1,
            endRow: -1,
            startCol: -1,
            endCol: -1,
            data: []
        };

        for (let i = this.selectionStartRow; i <= this.selectionEndRow; ++i) {
            for (let j = this.selectionStartCol; j <= this.selectionEndCol; ++j) {
                const dataOfCell = this.gridMatrix.getCell(i, j).data;
                if (!dataOfCell) continue;
                data.push(dataOfCell)
            }
        }
        this.selectedRangeCellData = {
            startRow: this.selectionStartRow,
            endRow: this.selectionEndRow,
            startCol: this.selectionStartCol,
            endCol: this.selectionEndCol,
            data
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