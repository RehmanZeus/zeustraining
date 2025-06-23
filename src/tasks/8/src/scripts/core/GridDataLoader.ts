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

        // 1. Get column names from the first object
        const columnNames = Object.keys(dataArray[0] as object);

        // 2. Write custom headers to row 1 (leave [0][*] as Excel style)
        for (let col = 0; col < columnNames.length; col++) {
            this.gridMatrix.grid[1][col + 1].data = columnNames[col].toUpperCase();
        }

        // 3. Write data, starting from row 2
        for (let row = 0; row < dataArray.length; row++) {
            const dataObj = dataArray[row] as Record<string, any>;
            for (let col = 0; col < columnNames.length; col++) {
                let cellValue = dataObj[columnNames[col]];
                if (typeof cellValue === "object") {
                    let isArray = Array.isArray(cellValue);
                    if (isArray) {
                        cellValue = cellValue.join(", ");
                    } else {
                        cellValue = JSON.stringify(cellValue);
                    }
                }
                this.gridMatrix.grid[row + 2][col + 1].data = cellValue; // <-- row+2
            }
        }
    }
}