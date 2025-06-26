import { DPR } from '../constants.js';

/**
 * SetupExcelSheet implements "virtual scrolling" with a fixed-size canvas
 * over a large scrollable area, enabling huge grids with smooth performance.
 *
 * Usage:
 *   const setup = new SetupExcelSheet(cellWidth, cellHeight, numRows, numCols, viewportW, viewportH);
 *   const canvas = setup.init();
 *   const ctx = setup.getContext();
 *   // On scroll, use setup.container.scrollLeft, scrollTop for visible region offsets.
 */
export class SetupExcelSheet {
    canvasWidth: number;    // viewport width in px
    canvasHeight: number;   // viewport height in px
    totalWidth: number;     // total grid width in px
    totalHeight: number;    // total grid height in px
    canvas!: HTMLCanvasElement;
    ctx!: CanvasRenderingContext2D;
    container!: HTMLDivElement;
    scrollArea!: HTMLDivElement;

    constructor(
        cellWidth: number, cellHeight: number,
        nrows: number, ncols: number,
        viewportWidth: number = 800, viewportHeight: number = 600 // sensible defaults
    ) {
        this.canvasWidth = viewportWidth;
        this.canvasHeight = viewportHeight;
        this.totalWidth = cellWidth * ncols;
        this.totalHeight = cellHeight * nrows;

        // Debug log
        console.log(`Grid: ${ncols} cols x ${nrows} rows`);
        console.log(`Cell size: ${cellWidth}x${cellHeight}`);
        console.log(`Viewport: ${viewportWidth}x${viewportHeight}`);
        console.log(`Total scroll size: ${this.totalWidth}x${this.totalHeight}`);
    }

    /**
     * Initializes the scrollable container, virtual scroll area, and fixed-size canvas.
     * Returns the canvas element for drawing.
     */
    init(): HTMLCanvasElement {
        // 1. Container (viewport)
        this.container = document.createElement('div');
        this.container.id = 'excel-container';
        this.container.style.width = this.canvasWidth + 'px';
        this.container.style.height = this.canvasHeight + 'px';
        this.container.style.overflow = 'auto';
        this.container.style.position = 'relative';
        this.container.style.margin = '0';
        this.container.style.padding = '0';
        this.container.style.boxSizing = 'border-box';

        // 2. Virtual scroll area (sets scrollbar size)
        this.scrollArea = document.createElement('div');
        this.scrollArea.style.width = this.totalWidth + 'px';
        this.scrollArea.style.height = this.totalHeight + 'px';
        this.scrollArea.style.position = 'relative';

        // 3. Canvas (fixed size, overlays viewport)
        this.canvas = document.createElement('canvas');
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.setCanvasResolution();

        this.ctx = this.canvas.getContext('2d')!;
        this.rescaleContext();
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = this.canvasWidth + 'px';
        this.canvas.style.height = this.canvasHeight + 'px';
        this.canvas.width = this.canvasWidth * DPR;
        this.canvas.height = this.canvasHeight * DPR;

        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.scale(DPR, DPR);

        // 4. Compose DOM
        this.scrollArea.appendChild(this.canvas); // canvas overlays scroll area
        this.container.appendChild(this.scrollArea);
        document.body.appendChild(this.container);

        // 5. Keep canvas overlaying the visible area as you scroll
        this.container.addEventListener('scroll', () => {
            const scrollLeft = this.container.scrollLeft;
            const scrollTop = this.container.scrollTop;
            this.canvas.style.left = scrollLeft + 'px';
            this.canvas.style.top = scrollTop + 'px';
        });

        // 6. Set initial canvas position (e.g. if container is scrolled on load)
        this.canvas.style.left = this.container.scrollLeft + 'px';
        this.canvas.style.top = this.container.scrollTop + 'px';
        window.addEventListener('resize', this.handleResizeOrZoom.bind(this));
        window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change', this.handleResizeOrZoom.bind(this));

        // Debug logging
        console.log(`Canvas CSS dimensions: ${this.canvasWidth}x${this.canvasHeight}`);
        console.log(`Canvas actual dimensions: ${this.canvas.width}x${this.canvas.height}`);
        console.log(`Container client size: ${this.container.clientWidth}x${this.container.clientHeight}`);
        console.log(`Scroll area size: ${this.scrollArea.offsetWidth}x${this.scrollArea.offsetHeight}`);

        return this.canvas;
    }

    /**
     * Returns the 2D canvas rendering context (after init()).
     */
    getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }

    setCanvasResolution() {
        const DPR = window.devicePixelRatio || 1;
        this.canvas.style.width = this.canvasWidth + 'px';
        this.canvas.style.height = this.canvasHeight + 'px';
        this.canvas.width = Math.round(this.canvasWidth * DPR);
        this.canvas.height = Math.round(this.canvasHeight * DPR);
    }

    rescaleContext() {
        const DPR = window.devicePixelRatio || 1;
        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any transforms
        this.ctx.scale(DPR, DPR);
    }

    /** Re-apply resolution and scaling on resize/zoom */
    handleResizeOrZoom() {
        this.setCanvasResolution();
        this.rescaleContext();
        // Redraw grid here if needed (call your redraw function)
    }
}