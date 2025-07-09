import { GridMatrix } from "./GridMatrix.js";
import { CellSelector } from "./CellSelector.js";
import { GridCell } from "./GridCell.js";
import { Column } from "../helpers/autoscroll/Column.js";


/**
 * ColumnSelector class handles column selection in a grid-like structure.
 * It allows for single and multi-column selection, drag-to-select functionality,
 */
export class ColumnSelector {
    /** Canvas context for rendering */
    ctx: CanvasRenderingContext2D;
    /** The grid matrix containing cell data and dimensions */
    gridMatrix: GridMatrix;
    /** Currently selected column index, -1 means no selection */
    selectedCol = -1;
    /** CellSelector instance for managing cell selection */
    cellSelector?: CellSelector;
    /** Array of selected column indices */
    selectedCols: number[] = [];
    /** Colors for selection and column header */
    selectionColor = "#0f9d58";
    /** Border color for selected columns */
    selectionBorderColor = "#137e43";
    /** Background color for column headers */
    columnHeaderBg = "#107c41";
    /** Text color for column headers */
    columnHeaderText = "#fff";
    /** HTML canvas element for rendering */
    canvas: HTMLCanvasElement | null = null;

    /** Initial selected columns when starting a drag operation */
    // This is used to remember the initial selection state when ctrl/dragging
    private initialSelectedCols: number[] = [];

    colAutoScroll?: Column;

    // Drag state
    private dragStartCol: number | null = null;
    private isDragging: boolean = false;
    private dragStarted = false;
    private pointerDownCol: number | null = null;


    /**
     * ColumnSelector constructor
     * @param ctx CanvasRenderingContext2D for rendering
     * @param gridMatrix The grid matrix containing cell data and dimensions
     * @param cellSelector CellSelector instance for managing cell selection
     */
    constructor(ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix, cellSelector: CellSelector) {
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;
        this.cellSelector = cellSelector;
    }

    /**
     * Sets the HTML canvas element for rendering.
     * @param canvas The HTMLCanvasElement to use for rendering
     */
    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    setColAutoScroll(c: Column) {
        this.colAutoScroll = c;
    }

    /**
     * Initializes event listeners for column selection.
     * Should be called after setting the canvas.
     */
    onPointerDown = (e: PointerEvent) => {

        console.log('PointerDown', e, this.isColumnHeader(e));
        this.dragStartCol = null;
        this.cellSelector?.selectCell(-1, -1);
        if (!this.isColumnHeader(e)) return;
        if (e.button !== 0) return;

        const colIndex = this.getColFromMouseEvent(e);
        if (colIndex < 0) return;

        this.dragStarted = false;
        this.pointerDownCol = colIndex;

        // Ctrl/Cmd+Click: toggle multi-select, but do not drag
        if (e.ctrlKey || e.metaKey) {
            const idx = this.selectedCols.indexOf(colIndex);
            if (idx === -1) {
                this.selectedCols.push(colIndex);
                this.selectedCol = colIndex;
            } else {
                this.selectedCols.splice(idx, 1);
                this.selectedCol = this.selectedCols.length ? this.selectedCols[this.selectedCols.length - 1] : -1;
            }
            if (this.cellSelector) {
                this.cellSelector.clearRangeSelection();
                this.cellSelector.selectedRow = -1;
                this.cellSelector.selectedCol = -1;
                this.cellSelector.isEditing = false;
                this.cellSelector.inputElement.style.display = 'none';
            }
            this.redrawGrid();
            // prepare for possible ctrl+drag
        }

        // Always prepare for drag (ctrl or not)
        this.isDragging = true;
        this.dragStartCol = colIndex;
        this.initialSelectedCols = (e.ctrlKey || e.metaKey) ? [...this.selectedCols] : [colIndex];

        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
    };

    /**
     * Handles pointer move events for dragging column selection.
     * Updates the selected columns based on drag position.
     * @param e PointerEvent from the mouse movement
     */
    onPointerMove = (e: PointerEvent) => {
        if (!this.isDragging || this.dragStartCol === null) return;
        this.dragStarted = true;
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const rect = container.getBoundingClientRect();
        const pointerX = e.clientX;

        if (this.colAutoScroll) {
            this.colAutoScroll.checkAutoScroll(e);
        }

        let colIndex: number = -1;

        if (pointerX < rect.left) {
            const scrollLeft = container.scrollLeft;
            let totalX = 0;
            for (let col = 0; col < this.gridMatrix.columnWidths.length; col++) {
                totalX += this.gridMatrix.columnWidths[col];
                if (totalX > scrollLeft) {
                    colIndex = col;
                    break;
                }
            }
            if (colIndex === -1) colIndex = 1;
        } else if (pointerX > rect.right) {
            const scrollLeft = container.scrollLeft;
            const viewportWidth = container.clientWidth;
            let totalX = 0;
            for (let col = 0; col < this.gridMatrix.columnWidths.length; col++) {
                totalX += this.gridMatrix.columnWidths[col];
                if (totalX > scrollLeft + viewportWidth) {
                    colIndex = col;
                    break;
                }
            }
            if (colIndex === -1) colIndex = this.gridMatrix.noOfCols - 1;
        } else {
            colIndex = this.getColFromMouseEvent(e);
        }

        if (colIndex < 0 || colIndex === this.selectedCol) return;

        const [start, end] = [this.dragStartCol, colIndex].sort((a, b) => a - b);
        let dragCols: number[] = [];
        for (let col = start; col <= end; col++) dragCols.push(col);

        if (e.ctrlKey || e.metaKey) {
            const allCols = Array.from(new Set([...this.initialSelectedCols, ...dragCols]));
            this.selectedCols = allCols.sort((a, b) => a - b);
        } else {
            this.selectedCols = dragCols;
        }
        this.selectedCol = colIndex;
        this.redrawGrid();
    };

    /**
     * Handles pointer up events to finalize column selection.
     * Cleans up drag state and event listeners.
     * @param e PointerEvent from the mouse release
     */
    onPointerUp = (e: PointerEvent) => {
        if (this.isDragging) {
            this.isDragging = false;
            this.initialSelectedCols = [];
            if (this.colAutoScroll) {
                this.colAutoScroll.clearAutoScroll();
            }
            window.removeEventListener('pointermove', this.onPointerMove);
            window.removeEventListener('pointerup', this.onPointerUp);

            // If simple click (no drag), select only that column (unless ctrl/cmd)
            if (!this.dragStarted && this.pointerDownCol !== null && !(e.ctrlKey || e.metaKey)) {
                this.selectedCols = [this.pointerDownCol];
                this.selectedCol = this.pointerDownCol;
                if (this.cellSelector) {
                    this.cellSelector.clearRangeSelection();
                    this.cellSelector.selectedRow = -1;
                    this.cellSelector.selectedCol = -1;
                    this.cellSelector.isEditing = false;
                    this.cellSelector.inputElement.style.display = 'none';
                }
                this.redrawGrid();
            }
            this.pointerDownCol = null;
            this.dragStarted = false;
        }
    };


    /**
     * Checks if the mouse event is over a column header.
     * @param e MouseEvent or PointerEvent to check
     * @returns true if the event is over a column header, false otherwise
     */
    isColumnHeader(e: MouseEvent | PointerEvent): boolean {
        if (!this.canvas) return false;
        const rect = this.canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const x = e.clientX - rect.left + container.scrollLeft;
        const y = e.clientY - rect.top;
        // console.log(`Mouse X Pos: ${e.clientX}\nMouse Y Pos: ${e.clientY}\nContainer Scrolled Left distance: ${container.scrollLeft}`);
        // console.log(`Cell X: ${x}\nCell Y: ${y}`);
        // console.log(`Rectangle Bounds: ${rect.left} ${rect.top}`)
        let totalX = 0;
        let colIndex = -1;
        for (let col = 0; col < this.gridMatrix.columnWidths.length; col++) {
            totalX += this.gridMatrix.columnWidths[col];
            // console.log(`Value X: ${x} || Value totalX = ${totalX} is X < totalX = ${x < totalX}`);
            if (x < totalX) {
                colIndex = col;
                break;
            }
        }
        const row0Height = this.gridMatrix.rowHeights[0];
        return (colIndex !== -1 && y >= 0 && y < row0Height && colIndex < this.gridMatrix.noOfCols);
    }

    /**
     * Gets the column index from a mouse event.
     * @param e MouseEvent or PointerEvent to get the column index from
     * @returns The column index, or -1 if not over a column header
     */
    getColFromMouseEvent(e: MouseEvent | PointerEvent): number {
        if (!this.canvas) return -1;
        const rect = this.canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const x = e.clientX - rect.left + container.scrollLeft;
        let totalX = 0;
        for (let col = 0; col < this.gridMatrix.columnWidths.length; col++) {
            totalX += this.gridMatrix.columnWidths[col];
            if (x < totalX) {
                return col;
            }
        }
        return -1;
    }


    /**
     * Selects a column by index.
     * @param col The column index to select (1-based)
     */
    selectCol(col: number) {
        if (col < 1 || col >= this.gridMatrix.noOfCols) return;
        this.selectedCol = col;
        if (this.cellSelector) {
            this.cellSelector.clearRangeSelection();
            this.cellSelector.selectedRow = -1;
            this.cellSelector.selectedCol = -1;
            this.cellSelector.isEditing = false;
            this.cellSelector.inputElement.style.display = 'none';
        }
        this.selectedCols = [col];
        this.redrawGrid();
    }

    /**
     * Clears the current column selection.
     * Resets the selected column index and clears the selected columns array.
     */
    clearSelection() {
        this.selectedCol = -1;
        this.selectedCols = [];
        this.redrawGrid();
    }

    /**
     * Gets the data from the selected column.
     * @returns An array of data from the selected column, or undefined if no column is selected.
     */
    getSelectedColData(): string[] | undefined {
        if (this.selectedCol < 1) return undefined;
        const col = this.selectedCol;
        const data: string[] = [];
        for (let row = 1; row < this.gridMatrix.noOfRows; row++) {
            const cell = this.gridMatrix.getCell(row, col);
            data.push(cell?.data || "");
        }
        return data;
    }

    /**
     * Sets the data for the selected column.
     * @param data An array of strings to set as the column data.
     */
    setSelectedColData(data: string[]) {
        if (this.selectedCol < 1) return;
        for (let row = 1; row < this.gridMatrix.noOfRows && row - 1 < data.length; row++) {
            this.gridMatrix.getCell(row, this.selectedCol).data = data[row - 1];
        }
        this.redrawGrid();
    }

    /**
     * Clears the data in the selected column.
     * Resets all cells in the selected column to empty strings.
     */
    clearSelectedCol() {
        if (this.selectedCol < 1) return;
        for (let row = 1; row < this.gridMatrix.noOfRows; row++) {
            this.gridMatrix.getCell(row, this.selectedCol).data = "";
        }
        this.redrawGrid();
    }

    /**
     * Draws the selection rectangle for the column header input.
     * @param row The row index of the header
     * @param col The column index of the header
     * @param scrollLeft The current horizontal scroll position
     * @param scrollTop The current vertical scroll position
     */
    drawSelectionForColumnHeaderInput(row: number, col: number, scrollLeft: number, scrollTop: number) {
        const { x, y, width, height } = GridCell.getCellRect(row, col, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);
        const drawX = x - scrollLeft;
        const drawY = y - scrollTop;

        const padding = 3; // Adjust for more/less padding

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255,255,255,0.125)';
        // Optional: shrink fill rect too, or keep full area
        this.ctx.fillRect(drawX, drawY, width, height);

        // Draw inside border with padding, 1px sharp
        this.ctx.strokeStyle = this.selectionBorderColor;
        this.ctx.lineWidth = 1;
        // +0.5 for pixel-perfect, +padding for inset
        this.ctx.strokeRect(
            drawX + padding + 0.5,
            drawY + padding + 0.5,
            width - 2 * padding - 1,
            height - 2 * padding - 1
        );

        this.ctx.restore();
    }

    /**
     * Handles keydown events for editing cells.
     * @param e KeyboardEvent to handle keydown events for editing cells
     * @returns 
     */
    handleKeydown(e: KeyboardEvent) {
        if (!this.cellSelector || this.cellSelector.isEditing) return;
        if (this.cellSelector.selectedRow > 0 && this.cellSelector.selectedCol > 0) return;
        if (!this.selectedCols.length) return;

        // Only respond to typing (not ctrl/alt/meta or function keys)
        if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey || e.altKey) return;

        let editCol = -1;

        console.log(this.dragStartCol)
        if (this.dragStartCol !== null) {
            // Drag selection: edit the cell in the column where drag started
            editCol = this.dragStartCol
        } else if (this.selectedCols.length > 1) {
            // Ctrl+click selection: edit the cell in the last selected column
            editCol = this.selectedCols[this.selectedCols.length - 1];
        } else {
            // Single column: edit that column
            editCol = this.selectedCol;
        }

        if (editCol > 0) {
            this.cellSelector.selectCell(1, editCol);
            this.cellSelector.startEditing(e.key);
            e.preventDefault();
        }
    }
    /**
     * Draws the selection rectangle for the column header input.
     * @param ctx CanvasRenderingContext2D to draw the selection
     * @param scrollLeft The current horizontal scroll position
     * @param scrollTop The current vertical scroll position
     * @param previewColIndex (optional) If set, use previewColWidth for the header cell at this column.
     * @param previewColWidth (optional) The temporary width to use for the header cell at previewColIndex.
     * @param suppressHeaderSelectionColor (optional) If true, do not fill the header selection color (for preview).
     * @returns 
     */
    drawSelection(
        ctx: CanvasRenderingContext2D,
        scrollLeft = 0,
        scrollTop = 0,
        previewColIndex?: number,
        previewColWidth?: number,
        suppressHeaderSelectionColor: boolean = false
    ) {
        if (!this.selectedCols || this.selectedCols.length === 0) return;

        const container = document.getElementById('excel-container') as HTMLDivElement;
        const currentScrollLeft = scrollLeft || container.scrollLeft;
        const currentScrollTop = scrollTop || container.scrollTop;

        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;
        const viewport = this.gridMatrix.getViewportBounds(currentScrollLeft, currentScrollTop, viewportWidth, viewportHeight);

        const sortedCols = [...this.selectedCols].sort((a, b) => a - b);

        let isContiguous = true;
        for (let i = 1; i < sortedCols.length; i++) {
            if (sortedCols[i] !== sortedCols[i - 1] + 1) {
                isContiguous = false;
                break;
            }
        }

        for (let idx = 0; idx < sortedCols.length; idx++) {
            const selectedCol = sortedCols[idx];
            // Use preview width for header if previewColIndex matches
            const width = (previewColIndex !== undefined && previewColWidth !== undefined && selectedCol === previewColIndex)
                ? previewColWidth
                : this.gridMatrix.columnWidths[selectedCol];
            const headerRect = GridCell.getCellRect(0, selectedCol, this.gridMatrix.rowHeights, [
                ...this.gridMatrix.columnWidths.slice(0, selectedCol),
                width,
                ...this.gridMatrix.columnWidths.slice(selectedCol + 1)
            ]);

            // 1. Column header (sticky at top, scrolls horizontally)
            if (!suppressHeaderSelectionColor) {
                const headerCell = this.gridMatrix.getCell(0, selectedCol);
                ctx.save();
                // Only fill header background if not previewing (Excel-like)

                ctx.fillStyle = this.columnHeaderBg;
                ctx.fillRect(headerRect.x - currentScrollLeft, 0, width, headerRect.height);

                ctx.font = "bold 14px Arial";
                ctx.fillStyle = this.columnHeaderText;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(
                    headerCell.data || "",
                    headerRect.x - currentScrollLeft + width / 2,
                    headerRect.height / 2
                );

            }
            // --- White border at the right of each selected header except the last ---
            if (idx < sortedCols.length - 1) {
                ctx.save();
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(headerRect.x - currentScrollLeft + width, 0);
                ctx.lineTo(headerRect.x - currentScrollLeft + width, headerRect.height);
                ctx.stroke();
                ctx.restore();
            }

            // Existing contiguous selection border logic...
            if (isContiguous) {
                ctx.strokeStyle = this.selectionBorderColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                if (idx === 0) {
                    ctx.moveTo(headerRect.x - currentScrollLeft, 0);
                    ctx.lineTo(headerRect.x - currentScrollLeft, headerRect.height);
                }
                if (idx === sortedCols.length - 1) {
                    ctx.moveTo(headerRect.x - currentScrollLeft + width, 0);
                    ctx.lineTo(headerRect.x - currentScrollLeft + width, headerRect.height);
                }
                ctx.stroke();
            }

            ctx.restore();

            for (let row = Math.max(1, viewport.startRow); row < viewport.endRow; row++) {
                const rect = GridCell.getCellRect(row, selectedCol, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);

                ctx.save();
                ctx.fillStyle = this.selectionColor + "20";

                if ((selectedCol === this.selectedCols[this.selectedCols.length - 1]) && row === 1 && this.selectedCols.length > 1 && !isContiguous) {
                    const container = document.getElementById('excel-container') as HTMLDivElement;

                    this.drawSelectionForColumnHeaderInput(row, selectedCol, container.scrollLeft, container.scrollTop);
                } else if (!(this.selectedCols.length === 1 && row === 1) && !(row === 1 && isContiguous && selectedCol === this.selectedCols[0])) {
                    ctx.fillRect(rect.x - currentScrollLeft, rect.y - currentScrollTop, rect.width, rect.height);
                }

                if (isContiguous) {
                    const x = rect.x - currentScrollLeft;
                    const y = rect.y - currentScrollTop;
                    const w = rect.width;
                    const h = rect.height;

                    ctx.strokeStyle = this.selectionBorderColor;
                    ctx.lineWidth = 1;
                    ctx.beginPath();

                    if (idx === 0) {
                        ctx.moveTo(x, y);
                        ctx.lineTo(x, y + h);
                    }
                    if (idx === sortedCols.length - 1) {
                        ctx.moveTo(x + w, y);
                        ctx.lineTo(x + w, y + h);
                    }
                    ctx.stroke();
                }
                ctx.restore();
            }

            for (let row = Math.max(1, viewport.startRow); row < viewport.endRow; row++) {
                const rowHeaderRect = GridCell.getCellRect(row, 0, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);
                const rowHeaderCell = this.gridMatrix.getCell(row, 0);

                ctx.save();
                ctx.fillStyle = "#caead8";
                ctx.fillRect(0, rowHeaderRect.y - currentScrollTop, rowHeaderRect.width, rowHeaderRect.height);

                ctx.font = "14px Arial";
                ctx.fillStyle = "#0f7072";
                ctx.textAlign = "right";
                ctx.textBaseline = "bottom";
                ctx.fillText(
                    rowHeaderCell.data || "",
                    rowHeaderRect.width - 8,
                    rowHeaderRect.y - currentScrollTop + rowHeaderRect.height - 4
                );

                ctx.beginPath();
                ctx.moveTo(0, rowHeaderRect.y - currentScrollTop + rowHeaderRect.height - 1);
                ctx.lineTo(rowHeaderRect.width, rowHeaderRect.y - currentScrollTop + rowHeaderRect.height - 1);
                ctx.strokeStyle = "#f5f5f5";
                ctx.lineWidth = 0.7;
                ctx.stroke();

                // ADD: Green border at the right of the row header if columns are selected
                ctx.beginPath();
                ctx.moveTo(rowHeaderRect.width - 1.5, rowHeaderRect.y - currentScrollTop);
                ctx.lineTo(rowHeaderRect.width - 1.5, rowHeaderRect.y - currentScrollTop + rowHeaderRect.height);
                ctx.strokeStyle = this.selectionBorderColor;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.restore();
            }
        }
    }

    /**
     * Redraws the grid and selection.
     * Clears the canvas and redraws the grid based on the current scroll position and viewport.
     */
    redrawGrid() {
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;

        const viewport = this.gridMatrix.getViewportBounds(scrollLeft, scrollTop, viewportWidth, viewportHeight);

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.gridMatrix.drawGrid(this.ctx, viewport, scrollLeft, scrollTop);

        this.drawSelection(this.ctx, scrollLeft, scrollTop);

        if (this.cellSelector) {
            this.cellSelector.drawSelection(this.ctx, scrollLeft, scrollTop);
        }
    }


    /**
     * Gets the mouse position relative to the canvas.
     * @param e MouseEvent to get the mouse position from
     * @param canvas The canvas element to get the position relative to
     * @returns The mouse position relative to the canvas
     */
    getMousePosition(e: MouseEvent, canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        return {
            x: e.clientX - rect.left + container.scrollLeft,
            y: e.clientY - rect.top
        };
    }
}