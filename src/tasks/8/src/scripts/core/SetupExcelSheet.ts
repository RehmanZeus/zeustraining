import {DPR} from '../constants.js'



/**
 * SetupExcelSheet is responsible for initializing and configuring the canvas
 * used to render the Excel-like grid interface. It calculates canvas dimensions
 * based on grid size and provides access to the 2D rendering context.
 */
export class SetupExcelSheet {

    /** Width of the canvas in pixels, derived from number of columns and cell width */
    canvasWidth: number; // Remove the default assignment

    /** Height of the canvas in pixels, derived from number of rows and cell height */
    canvasHeight: number; // Remove the default assignment

    /** Reference to the HTML canvas element used for rendering */
    canvas!: HTMLCanvasElement;

    /** 2D rendering context for drawing on the canvas */
    ctx!: CanvasRenderingContext2D;

    /**
     * Constructs the SetupExcelSheet instance and calculates canvas dimensions.
     * 
     * @param gridWidth - Width of each grid cell
     * @param gridHeight - Height of each grid cell
     * @param nrows - Total number of rows in the grid
     * @param ncols - Total number of columns in the grid
     */
    constructor(gridWidth: number, gridHeight: number, nrows: number, ncols: number) {
        // Calculate canvas dimensions based on total grid size
        this.canvasWidth = gridWidth * ncols;
        this.canvasHeight = gridHeight * nrows;
        
        // Debug: Log the calculated dimensions
        console.log(`Calculated canvas dimensions: ${this.canvasWidth}x${this.canvasHeight}`);
        console.log(`Grid: ${ncols} cols x ${nrows} rows, Cell: ${gridWidth}x${gridHeight}`);
    }

    /**
     * Initializes the canvas element by setting its dimensions and scaling
     * for high-DPI displays. Also retrieves and stores the 2D rendering context.
     * 
     * @returns The initialized HTMLCanvasElement
     */
    init(): HTMLCanvasElement {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        
        // Set canvas dimensions in CSS pixels
        this.canvas.style.width = this.canvasWidth + 'px';
        this.canvas.style.height = this.canvasHeight + 'px';
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0';
        this.canvas.style.padding = '0';
        
        // Set actual canvas dimensions accounting for device pixel ratio
        this.canvas.width = this.canvasWidth * DPR;
        this.canvas.height = this.canvasHeight * DPR;
        
        // Scale context to match DPR
        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.scale(DPR, DPR);
        
        // Create a container with scrolling capability
        const container = document.createElement('div');
        container.id = 'excel-container';
        
        // Set container to viewport size
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.overflow = 'auto';
        // container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.margin = '0';
        container.style.padding = '0';
        container.style.boxSizing = 'border-box';

        // Ensure body doesn't interfere with scrolling
        document.body.style.overflow = 'hidden';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        
        
        
        // Add the canvas to the container
        container.appendChild(this.canvas);
        document.body.appendChild(container);
        
        // Force reflow
        container.offsetHeight;
        
        // Debug logging
        console.log(`Canvas CSS dimensions: ${this.canvasWidth}x${this.canvasHeight}`);
        console.log(`Canvas actual dimensions: ${this.canvas.width}x${this.canvas.height}`);
        console.log(`Container client size: ${container.clientWidth}x${container.clientHeight}`);
        console.log(`Container scroll size: ${container.scrollWidth}x${container.scrollHeight}`);
        
        // Verify scrolling capability
        const canScrollH = container.scrollWidth > container.clientWidth;
        const canScrollV = container.scrollHeight > container.clientHeight;
        console.log(`Can scroll horizontally: ${canScrollH}`);
        console.log(`Can scroll vertically: ${canScrollV}`);
        
        if (!canScrollH && !canScrollV) {
            console.warn('⚠️ Canvas is not larger than viewport - no scrolling needed');
        } else {
            console.log('✅ Canvas should be scrollable');
        }
        
        return this.canvas;
    }

    /**
     * Provides access to the canvas's 2D rendering context.
     * 
     * @returns CanvasRenderingContext2D
     */
    getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }
}


