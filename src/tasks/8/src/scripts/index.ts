import { CellSelector } from "./core/CellSelector.js";
import { ColumnSelector } from "./core/ColumnSelector.js";
import { GridDataGen } from "./core/GridDataGen.js";
import { GridDataLoader } from "./core/GridDataLoader.js";
import { GridMatrix } from "./core/GridMatrix.js";
import { GridResizer } from "./core/GridResizer.js";
import { Operations } from "./core/Operations.js";
import { RowSelector } from "./core/RowSelector.js";
import { SetupExcelSheet } from "./core/SetupExcelSheet.js";



const NUM_ROWS = 1000, NUM_COLS = 100, CELL_W = 70, CELL_H = 25;


// ...rest of your app
window.onload = () => {
    const setup = new SetupExcelSheet(CELL_W,CELL_H, NUM_ROWS, NUM_COLS, window.innerWidth, window.innerHeight);
    const canvas = setup.init();
    const ctx = setup.getContext();

    // Get the container after it's been created in init()
    const container = document.getElementById('excel-container') as HTMLDivElement;

    const gridMatrix = new GridMatrix(ctx, NUM_ROWS, NUM_COLS);

    // --- Other grid features and selectors ---
    const resizer = new GridResizer(canvas, ctx, gridMatrix);
    const cellSelector = new CellSelector(canvas, ctx, gridMatrix);
    resizer.setCellSelector(cellSelector);
    
    const gridDataLoader = new GridDataLoader(gridMatrix);
    const dataGen = new GridDataGen(200);
    const sampleData = dataGen.generateData();
    gridDataLoader.loadJSONData(sampleData);

    const rowSelector = new RowSelector(ctx, gridMatrix,cellSelector);
    rowSelector.attachEvents(canvas);

    const colSelector = new ColumnSelector(ctx, gridMatrix);
    colSelector.attachEvents(canvas);

    const sumBtn = document.getElementById("calc-sum");
    const operations = new Operations(rowSelector, colSelector, gridMatrix, ctx);
    sumBtn?.addEventListener("click", operations.sumRows.bind(operations));
    // --- Only draw visible grid (viewport) ---
    function drawVisibleGrid() {
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate and draw only cells that are visible (viewport)
        const viewport = gridMatrix.getViewportBounds(scrollLeft, scrollTop, viewportWidth, viewportHeight);
          gridMatrix.drawGrid(ctx, viewport, scrollLeft, scrollTop);

        cellSelector.drawSelection(ctx, scrollLeft, scrollTop);
        rowSelector.drawSelection?.(ctx); 
        colSelector.drawSelection?.(ctx); 
    }

    // --- Use requestAnimationFrame to batch scroll redraws ---
    let animationFrameId: number | null = null;
    container.addEventListener('scroll', () => {
        if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
            drawVisibleGrid();
            animationFrameId = null;
        });
    });

    // --- Initial draw ---
    drawVisibleGrid();


    canvas.tabIndex = 0;
    canvas.focus();


    // --- Pass viewport redraw to selectors and resizer ---
    cellSelector.setRedrawGridCallback(drawVisibleGrid);
    rowSelector.redrawGrid = drawVisibleGrid;
    colSelector.redrawGrid = drawVisibleGrid;
    resizer.setRedrawGridCallback(drawVisibleGrid);

    gridMatrix.logStats()
};