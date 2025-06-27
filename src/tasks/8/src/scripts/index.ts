import { CellSelector } from "./core/CellSelector.js";
import { ColumnSelector } from "./core/ColumnSelector.js";
import { EventManager } from "./core/EventManager.js";
import { ExcelHeader } from "./core/ExcelHeader.js";
import { GridDataGen } from "./core/GridDataGen.js";
import { GridDataLoader } from "./core/GridDataLoader.js";
import { GridMatrix } from "./core/GridMatrix.js";
import { GridResizer } from "./core/GridResizer.js";
import { Operations } from "./core/Operations.js";
import { RowSelector } from "./core/RowSelector.js";
import { SetupExcelSheet } from "./core/SetupExcelSheet.js";
import { Logger } from "./core/Logger.js";

const NUM_ROWS = 10000, NUM_COLS = 1000, CELL_W = 70, CELL_H = 25;

window.onload = () => {
    console.log(window.innerHeight,window.innerWidth)
    const setup = new SetupExcelSheet(CELL_W, CELL_H, NUM_ROWS, NUM_COLS, window.innerWidth, window.innerHeight);
    const canvas = setup.init();
    const ctx = setup.getContext();

    const container = document.getElementById('excel-container') as HTMLDivElement;
    const gridMatrix = new GridMatrix(ctx, NUM_ROWS, NUM_COLS);

    const resizer = new GridResizer(canvas, ctx, gridMatrix);
    const cellSelector = new CellSelector(canvas, ctx, gridMatrix);
    resizer.setCellSelector(cellSelector);

    const gridDataLoader = new GridDataLoader(gridMatrix);
    const dataGen = new GridDataGen(500);
    const sampleData = dataGen.generateData();
    gridDataLoader.loadJSONData(sampleData);

    const rowSelector = new RowSelector(ctx, gridMatrix, cellSelector);
    rowSelector.setCanvas(canvas);

    const colSelector = new ColumnSelector(ctx, gridMatrix, cellSelector);
    colSelector.setCanvas(canvas);

    const sumBtn = document.getElementById("calc-sum");
    const operations = new Operations(rowSelector, colSelector, gridMatrix, ctx, cellSelector);
    sumBtn?.addEventListener("click", operations.sumRows.bind(operations));
    gridMatrix.setCellSelector(cellSelector);
    function drawVisibleGrid() {
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const viewport = gridMatrix.getViewportBounds(scrollLeft, scrollTop, viewportWidth, viewportHeight);

        // 1. Draw grid
        gridMatrix.drawGrid(ctx, viewport, scrollLeft, scrollTop);

        // 2. Draw selections
        cellSelector.drawSelection(ctx, scrollLeft, scrollTop);
        if (rowSelector.drawSelection) {
            rowSelector.drawSelection(ctx, scrollLeft, scrollTop);
        }
        if (colSelector.drawSelection) {
            colSelector.drawSelection(ctx, scrollLeft, scrollTop);
        }

        // 3. ALWAYS draw corner cell last to ensure it's on top
        drawCornerCell(ctx);
    }

    function drawCornerCell(ctx: CanvasRenderingContext2D) {
        const cornerWidth = gridMatrix.columnWidths[0];
        const cornerHeight = gridMatrix.rowHeights[0];

        ctx.save();
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(0, 0, cornerWidth, cornerHeight);
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, cornerWidth, cornerHeight);
        ctx.restore();
    }

    let animationFrameId: number | null = null;
    container.addEventListener('scroll', () => {
        if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
            drawVisibleGrid(); // This should redraw the selection with new scroll position
            animationFrameId = null;
        });
    });

    drawVisibleGrid();

    canvas.tabIndex = 0;
    canvas.focus();

    cellSelector.setRedrawGridCallback(drawVisibleGrid);
    rowSelector.redrawGrid = drawVisibleGrid;
    colSelector.redrawGrid = drawVisibleGrid;
    resizer.setRedrawGridCallback(drawVisibleGrid);

    // gridMatrix.logStats();
    cellSelector.selectCell(1, 1)

    window.addEventListener('resize', () => {
        drawVisibleGrid();
    });


    // --- Attach all pointer/click events to EventAttacher! ---
    new EventManager(canvas, cellSelector, colSelector, rowSelector, resizer);

    // new ExcelHeader(cellSelector, gridMatrix, operations);

};