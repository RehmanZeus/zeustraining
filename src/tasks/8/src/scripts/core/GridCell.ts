import {  MIN_GRIDCELL_HEIGHT, MIN_GRIDCELL_WIDTH } from "../constants.js";


/**
 * GridCell represents a single cell within the grid matrix.
 * It stores positional data, dimensions, content, and rendering context.
 */
export class GridCell {

    /** Unique identifier for the cell, typically a combination of row and column (e.g., "0A") */
    id: string;

    /** Height of the cell in pixels */
    height: number = MIN_GRIDCELL_HEIGHT;

    /** Width of the cell in pixels */
    width: number = MIN_GRIDCELL_WIDTH;

    /** X-axis position of the cell on the canvas */
    x: number = 0;

    /** Y-axis position of the cell on the canvas */
    y: number = 0;

    /** Content of the cell, which may be user input or loaded data */
    data: string | undefined;

    /** Canvas 2D rendering context used for drawing the cell */
    c: CanvasRenderingContext2D;

    /**
     * Constructs a GridCell instance with optional dimensions and content.
     * 
     * @param id - Unique identifier for the cell
     * @param x - X-axis position of the cell
     * @param y - Y-axis position of the cell
     * @param c - Canvas 2D rendering context
     * @param width - Optional width of the cell
     * @param height - Optional height of the cell
     * @param data - Optional initial content of the cell
     */
    constructor(
        id: string,
        x: number,
        y: number,
        c: CanvasRenderingContext2D,
        width?: number,
        height?: number,
        data?: string
    ) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.c = c;
        this.width = width ?? this.width;
        this.height = height ?? this.height;
        this.data = data;
    }

    /**
     * Generates an Excel-style column header string based on a zero-based index.
     * For example: 0 → "A", 25 → "Z", 26 → "AA", etc.
     * 
     * @param index - Zero-based column index
     * @returns Column header string
     */
    static generateHeader(index: number): string {
        let header = "";
        while (index >= 0) {
            header = String.fromCharCode((index % 26) + 65) + header;
            index = Math.floor(index / 26) - 1;
        }
        return header;
    }

    
}
