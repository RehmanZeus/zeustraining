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

    constructor(ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix, cellSelector: CellSelector) {
        this.ctx = ctx;
        this.gridMatrix = gridMatrix;
        this.cellSelector = cellSelector;
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    isColumnHeader(e: MouseEvent): boolean {
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

    onClick(e: MouseEvent) {
        if (!this.canvas) return;
        const { x, y } = this.getMousePosition(e, this.canvas);

        // Find col
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
        if (colIndex === -1 || y >= row0Height || colIndex >= this.gridMatrix.noOfCols) {
            this.clearSelection();
            return;
        }

        // Support Ctrl+Click for multi-selection
        if (e.ctrlKey || e.metaKey) {
            const idx = this.selectedCols.indexOf(colIndex);
            if (idx === -1) {
                this.selectedCols.push(colIndex);
            } else {
                this.selectedCols.splice(idx, 1);
            }
            this.selectedCol = colIndex;
            if (this.cellSelector) {
                this.cellSelector.clearRangeSelection();
                this.cellSelector.selectedRow = -1;
                this.cellSelector.selectedCol = -1;
                this.cellSelector.isEditing = false;
                this.cellSelector.inputElement.style.display = 'none';
            }
            this.redrawGrid();
            return;
        }

        // Single column selection (no Ctrl)
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
    }

    /** Select a column by index and redraw */
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

        // Get FRESH scroll values if not provided
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const currentScrollLeft = scrollLeft || container.scrollLeft;
        const currentScrollTop = scrollTop || container.scrollTop;

        console.log(`Drawing column selection with scroll: ${currentScrollLeft}, ${currentScrollTop}`); // Debug

        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;
        const viewport = this.gridMatrix.getViewportBounds(currentScrollLeft, currentScrollTop, viewportWidth, viewportHeight);

        for (const selectedCol of this.selectedCols) {
            // Use currentScrollLeft and currentScrollTop everywhere
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

            ctx.strokeStyle = this.selectionBorderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(headerRect.x - currentScrollLeft, 0, headerRect.width, headerRect.height);
            ctx.restore();

            // 2. Data cells (scroll in both directions)
            for (let row = Math.max(1, viewport.startRow); row < viewport.endRow; row++) {
                const rect = GridCell.getCellRect(row, selectedCol, this.gridMatrix.rowHeights, this.gridMatrix.columnWidths);

                ctx.save();
                ctx.fillStyle = this.selectionColor + "20";
                ctx.fillRect(rect.x - currentScrollLeft, rect.y - currentScrollTop, rect.width, rect.height);
                ctx.strokeStyle = this.selectionBorderColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(rect.x - currentScrollLeft, rect.y - currentScrollTop, rect.width, rect.height);
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

        console.log(`ColumnSelector redraw: ${scrollLeft}, ${scrollTop}`); // Debug log

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
            y: e.clientY - rect.top + container.scrollTop
        };
    }
}