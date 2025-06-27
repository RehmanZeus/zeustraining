/**
 * GridCell represents a single cell's content (data) and ID.
 * No layout or rendering state is stored.
 */
export class GridCell {
    /** Unique identifier for the cell, typically a combination of row and column (e.g., "0A") */
    id: string;
    /** Content of the cell, which may be user input or loaded data */
    data: string | undefined;


    /**
     * Creates a new GridCell instance.
     * @param id Unique identifier for the cell.
     * @param data Optional initial data for the cell.
     */
    constructor(id: string, data?: string) {
        this.id = id;
        this.data = data;
    }

    /**
     * Generates a unique ID for a cell based on its row and column indices.
     * @param row The row index of the cell (zero-based).
     * @param col The column index of the cell (zero-based).
     * @returns A string representing the cell's ID (e.g., "0A", "1B").
     */
    static generateHeader(index: number): string {
        let header = "";
        while (index >= 0) {
            header = String.fromCharCode((index % 26) + 65) + header;
            index = Math.floor(index / 26) - 1;
        }
        return header;
    }

    /**
     * Gets the rectangle area of a cell in the grid.
     * @param row The row index of the cell (zero-based).
     * @param col The column index of the cell (zero-based).
     * @param rowHeights An array of heights for each row.
     * @param columnWidths An array of widths for each column.
     * @returns An object representing the cell's position and size.
     */
    static getCellRect(
        row: number, col: number,
        rowHeights: number[], columnWidths: number[]
    ): { x: number, y: number, width: number, height: number } {
        const x = columnWidths.slice(0, col).reduce((a, b) => a + b, 0);
        const y = rowHeights.slice(0, row).reduce((a, b) => a + b, 0);
        const width = columnWidths[col];
        const height = rowHeights[row];
        return { x, y, width, height };
    }
}