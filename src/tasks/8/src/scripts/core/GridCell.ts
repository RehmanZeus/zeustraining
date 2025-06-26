/**
 * GridCell represents a single cell's content (data) and ID.
 * No layout or rendering state is stored.
 */
export class GridCell {
    /** Unique identifier for the cell, typically a combination of row and column (e.g., "0A") */
    id: string;
    /** Content of the cell, which may be user input or loaded data */
    data: string | undefined;

    constructor(id: string, data?: string) {
        this.id = id;
        this.data = data;
    }

    /**
     * Generates an Excel-style column header string based on a zero-based index.
     * For example: 0 → "A", 25 → "Z", 26 → "AA", etc.
     */
    static generateHeader(index: number): string {
        let header = "";
        while (index >= 0) {
            header = String.fromCharCode((index % 26) + 65) + header;
            index = Math.floor(index / 26) - 1;
        }
        return header;
    }

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