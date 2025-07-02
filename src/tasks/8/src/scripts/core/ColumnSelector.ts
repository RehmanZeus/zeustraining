import { GridMatrix } from "./GridMatrix.js";
import { CellSelector } from "./CellSelector.js";
import { GridCell } from "./GridCell.js";

export class ColumnSelector {
    ctx: CanvasRenderingContext2D;
    gridMatrix: GridMatrix;
    selectedCol = -1;
    cellSelector?: CellSelector;
    selectedCols: number[] = [];
    selectionColor = "#0f9d58";
    selectionBorderColor = "#137e43";
    columnHeaderBg = "#107c41";
    columnHeaderText = "#fff";
    canvas: HTMLCanvasElement | null = null;

    // Drag state
    private dragStartCol: number | null = null;
    private isDragging: boolean = false;

    constructor(ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix, cellSelector: CellSelector) {
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;
        this.cellSelector = cellSelector;
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

  

    onPointerDown = (e: PointerEvent) => {
        if (!this.isColumnHeader(e)) return;
        // Only left click
        if (e.button !== 0) return;

        const colIndex = this.getColFromMouseEvent(e);
        if (colIndex < 0) return;

        if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd+Click: toggle column selection
            const idx = this.selectedCols.indexOf(colIndex);
            if (idx === -1) {
                this.selectedCols.push(colIndex);
                this.selectedCol = colIndex;
            } else {
                this.selectedCols.splice(idx, 1);
                // Update selectedCol to last or -1
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
            // Do NOT begin drag-selection on ctrlKey
            return;
        }

        // Begin drag-selection
        this.isDragging = true;
        this.dragStartCol = colIndex;
        this.selectedCols = [colIndex];
        this.selectedCol = colIndex;

        if (this.cellSelector) {
            this.cellSelector.clearRangeSelection();
            this.cellSelector.selectedRow = -1;
            this.cellSelector.selectedCol = -1;
            this.cellSelector.isEditing = false;
            this.cellSelector.inputElement.style.display = 'none';
        }
        this.redrawGrid();

       
    };

    onPointerMove = (e: PointerEvent) => {
        if (!this.isDragging || this.dragStartCol === null) return;
        const colIndex = this.getColFromMouseEvent(e);
        if (colIndex < 0 || colIndex === this.selectedCol) return;

        // Drag selection: select contiguous range
        const [start, end] = [this.dragStartCol, colIndex].sort((a, b) => a - b);
        this.selectedCols = [];
        for (let col = start; col <= end; col++) {
            this.selectedCols.push(col);
        }
        this.selectedCol = colIndex;
        this.redrawGrid();
    };

    onPointerUp = (_e: PointerEvent) => {
        if (this.isDragging) {
            this.isDragging = false;
        
        }
    };

    isColumnHeader(e: MouseEvent | PointerEvent): boolean {
        if (!this.canvas) return false;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        let totalX = 0;
        let colIndex = -1;
        for (let col = 0; col < this.gridMatrix.columnWidths.length; col++) {
            totalX += this.gridMatrix.columnWidths[col];
            if (x < totalX) {
                colIndex = col;
                break;
            }
        }
        const row0Height = this.gridMatrix.rowHeights[0];
        return (colIndex !== -1 && y >= 0 && y < row0Height && colIndex < this.gridMatrix.noOfCols);
    }

    getColFromMouseEvent(e: MouseEvent | PointerEvent): number {
        if (!this.canvas) return -1;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        let totalX = 0;
        for (let col = 0; col < this.gridMatrix.columnWidths.length; col++) {
            totalX += this.gridMatrix.columnWidths[col];
            if (x < totalX) {
                return col;
            }
        }
        return -1;
    }

    // The rest of your methods (selectCol, clearSelection, getSelectedColData, etc.) remain unchanged...

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

    clearSelection() {
        this.selectedCol = -1;
        this.selectedCols = [];
        this.redrawGrid();
    }

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

    setSelectedColData(data: string[]) {
        if (this.selectedCol < 1) return;
        for (let row = 1; row < this.gridMatrix.noOfRows && row - 1 < data.length; row++) {
            this.gridMatrix.getCell(row, this.selectedCol).data = data[row - 1];
        }
        this.redrawGrid();
    }

    clearSelectedCol() {
        if (this.selectedCol < 1) return;
        for (let row = 1; row < this.gridMatrix.noOfRows; row++) {
            this.gridMatrix.getCell(row, this.selectedCol).data = "";
        }
        this.redrawGrid();
    }

    drawSelection(ctx: CanvasRenderingContext2D, scrollLeft = 0, scrollTop = 0) {
        if (!this.selectedCols || this.selectedCols.length === 0) return;

        const container = document.getElementById('excel-container') as HTMLDivElement;
        const currentScrollLeft = scrollLeft || container.scrollLeft;
        const currentScrollTop = scrollTop || container.scrollTop;

        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;
        const viewport = this.gridMatrix.getViewportBounds(currentScrollLeft, currentScrollTop, viewportWidth, viewportHeight);

        // Sort columns for easier logic
        const sortedCols = [...this.selectedCols].sort((a, b) => a - b);

        // Check if selection is contiguous
        let isContiguous = true;
        for (let i = 1; i < sortedCols.length; i++) {
            if (sortedCols[i] !== sortedCols[i - 1] + 1) {
                isContiguous = false;
                break;
            }
        }

        for (let idx = 0; idx < sortedCols.length; idx++) {
            const selectedCol = sortedCols[idx];
            const headerRect = GridCell.getCellRect(0, selectedCol, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);

            // 1. Column header (sticky at top, scrolls horizontally)
            const headerCell = this.gridMatrix.getCell(0, selectedCol);
            ctx.save();
            ctx.fillStyle = this.columnHeaderBg;
            ctx.fillRect(headerRect.x - currentScrollLeft, 0, headerRect.width, headerRect.height);

            ctx.font = "14px Arial";
            ctx.fillStyle = this.columnHeaderText;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                headerCell.data || "",
                headerRect.x - currentScrollLeft + headerRect.width / 2,
                headerRect.height / 2
            );

            // Draw border only for contiguous drag selection
            if (isContiguous) {
                ctx.strokeStyle = this.selectionBorderColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                // Only left border for first column
                if (idx === 0) {
                    ctx.moveTo(headerRect.x - currentScrollLeft, 0);
                    ctx.lineTo(headerRect.x - currentScrollLeft, headerRect.height);
                }
                // Only right border for last column
                if (idx === sortedCols.length - 1) {
                    ctx.moveTo(headerRect.x - currentScrollLeft + headerRect.width, 0);
                    ctx.lineTo(headerRect.x - currentScrollLeft + headerRect.width, headerRect.height);
                }
                ctx.stroke();
            }

            ctx.restore();

            // 2. Data cells (scroll in both directions)
            for (let row = Math.max(1, viewport.startRow); row < viewport.endRow; row++) {
                const rect = GridCell.getCellRect(row, selectedCol, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);

                ctx.save();
                ctx.fillStyle = this.selectionColor + "20";
                ctx.fillRect(rect.x - currentScrollLeft, rect.y - currentScrollTop, rect.width, rect.height);

                // Only draw left/right borders for contiguous drag
                if (isContiguous) {
                    const x = rect.x - currentScrollLeft;
                    const y = rect.y - currentScrollTop;
                    const w = rect.width;
                    const h = rect.height;

                    ctx.strokeStyle = this.selectionBorderColor;
                    ctx.lineWidth = 1;
                    ctx.beginPath();

                    // Left
                    if (idx === 0) {
                        ctx.moveTo(x, y);
                        ctx.lineTo(x, y + h);
                    }
                    // Right
                    if (idx === sortedCols.length - 1) {
                        ctx.moveTo(x + w, y);
                        ctx.lineTo(x + w, y + h);
                    }
                    ctx.stroke();
                }

                ctx.restore();
            }

            // 3. Row headers (sticky at left, scroll vertically)
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

                // Draw bottom border
                ctx.beginPath();
                ctx.moveTo(0, rowHeaderRect.y - currentScrollTop + rowHeaderRect.height - 1);
                ctx.lineTo(rowHeaderRect.width, rowHeaderRect.y - currentScrollTop + rowHeaderRect.height - 1);
                ctx.strokeStyle = "#f5f5f5";
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.restore();
            }
        }
    }

    redrawGrid() {
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;

        const viewport = this.gridMatrix.getViewportBounds(scrollLeft, scrollTop, viewportWidth, viewportHeight);

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw grid first
        this.gridMatrix.drawGrid(this.ctx, viewport, scrollLeft, scrollTop);

        // Draw column selection with current scroll values
        this.drawSelection(this.ctx, scrollLeft, scrollTop);

        // Also draw other selections if they exist
        if (this.cellSelector) {
            this.cellSelector.drawSelection(this.ctx, scrollLeft, scrollTop);
        }
    }

    getMousePosition(e: MouseEvent, canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect();
        const container = document.getElementById('excel-container') as HTMLDivElement;
        return {
            x: e.clientX - rect.left + container.scrollLeft,
            y: e.clientY - rect.top
        };
    }
}