import { GridMatrix } from "./GridMatrix.js";

export class GridDataLoader {
    gridMatrix: GridMatrix;

    constructor(gridMatrix: GridMatrix) {
        this.gridMatrix = gridMatrix;
    }

    loadJSONData<T>(dataArray: T[]): void {
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            console.warn("No data to load.");
            return;
        }

        // 1. Get column names and dimensions up front
        const columnNames = Object.keys(dataArray[0] as object);
        const requiredRows = dataArray.length + 2;
        const requiredCols = columnNames.length + 1;
        const gridMatrix = this.gridMatrix; // local for speed

        // 2. Expand grid if needed (this is fast, only updates headers and arrays)
        gridMatrix.addMoreGrids(requiredRows, requiredCols);

        // 3. Write custom headers (row 1)
        for (let col = 0; col < columnNames.length; ++col) {
            gridMatrix.getCell(1, col + 1).data = columnNames[col];
        }

        // 4. Write data (row 2+)
        for (let row = 0; row < dataArray.length; ++row) {
            const dataObj = dataArray[row] as Record<string, any>;
            for (let col = 0; col < columnNames.length; ++col) {
                let cellValue = dataObj[columnNames[col]];
                if (typeof cellValue === "object" && cellValue !== null) {
                    if (Array.isArray(cellValue)) {
                        cellValue = cellValue.join(", ");
                    } else {
                        cellValue = JSON.stringify(cellValue);
                    }
                }
                gridMatrix.getCell(row + 2, col + 1).data = cellValue;
            }
        }
    }
}