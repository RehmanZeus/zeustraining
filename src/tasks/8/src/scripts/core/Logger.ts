import { GridMatrix } from "./GridMatrix.js";
import { CellSelector } from "./CellSelector.js";

export class Logger {
    private static instance: Logger;
    private history: string[] = [];

    private constructor() { }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    log(msg: string, data?: any) {
        const timestamp = new Date().toISOString();
        const formatted = `[${timestamp}] ${msg}`;
        this.history.push(formatted + (data ? `: ${JSON.stringify(data)}` : ""));
        // Also log to the console
        if (data !== undefined) {
            console.log(formatted, data);
        } else {
            console.log(formatted);
        }
    }

    logGridStats(gridMatrix: GridMatrix, canvas: HTMLCanvasElement) {
        // Total cells = all data cells (not just instantiated)
        const totalCells = (gridMatrix.noOfRows - 1) * (gridMatrix.noOfCols - 1);

        // Count populated and empty cells
        let cellsWithData = 0, cellsWithoutData = 0;
        for (const [_row, rowMap] of gridMatrix.grid.entries()) {
            for (const [_col, cell] of rowMap.entries()) {
                if (_row === 0 || _col === 0) continue; // skip header
                if (cell.data && cell.data !== "") cellsWithData++;
                else cellsWithoutData++;
            }
        }

        // Get visible region (canvas size, and visible grid area)
        const container = canvas.parentElement as HTMLDivElement;
        const viewport = gridMatrix.getViewportBounds(
            container.scrollLeft, container.scrollTop, container.clientWidth, container.clientHeight
        );

        const memUsed = ((totalCells * 120) / (1024 * 1024)).toFixed(2); // rough estimate

        this.log("Grid Stats", {
            rows: gridMatrix.noOfRows,
            cols: gridMatrix.noOfCols,
            totalCells,
            cellsWithData,
            cellsWithoutData,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            visibleRows: `${viewport.startRow} - ${viewport.endRow}`,
            visibleCols: `${viewport.startCol} - ${viewport.endCol}`,
            memoryEstimateMB: memUsed
        });
    }

    logCellSelection(cellSelector: CellSelector) {
        this.log("Cell selected", {
            selectedRow: cellSelector.selectedRow,
            selectedCol: cellSelector.selectedCol,
            reference: cellSelector.getSelectedCellReference(),
            value: cellSelector.getSelectedCellData()
        });
    }

    logDragSelection(cellSelector: CellSelector) {
        this.log("Drag selection started/ended", {
            anchorRow: cellSelector.anchorRow,
            anchorCol: cellSelector.anchorCol,
            selectionStart: {
                row: cellSelector.selectionStartRow,
                col: cellSelector.selectionStartCol
            },
            selectionEnd: {
                row: cellSelector.selectionEndRow,
                col: cellSelector.selectionEndCol
            }
        });
    }

    logEditing(cellSelector: CellSelector, event: "start" | "finish" | "cancel") {
        this.log(`Cell editing ${event}`, {
            row: cellSelector.selectedRow,
            col: cellSelector.selectedCol,
            value: cellSelector.inputElement?.value
        });
    }

    // Add more as needed, for resizes, errors, etc.

    getHistory(): string[] {
        return this.history;
    }

    clearHistory() {
        this.history = [];
    }
}