import { MIN_GRIDCELL_HEIGHT, MIN_GRIDCELL_WIDTH } from "./constants.js";
import { CellSelector } from "./core/CellSelector.js";
import { ColumnSelector } from "./core/ColumnSelector.js";
import { GridDataGen } from "./core/GridDataGen.js";
import { GridDataLoader } from "./core/GridDataLoader.js";
import { GridMatrix } from "./core/GridMatrix.js";
import { GridResizer } from "./core/GridResizer.js";
import { Operations } from "./core/Operations.js";
import { RowSelector } from "./core/RowSelector.js";
import { SetupExcelSheet } from "./core/SetupExcelSheet.js";





window.onload = () => {
    const setup = new SetupExcelSheet(MIN_GRIDCELL_WIDTH, MIN_GRIDCELL_HEIGHT, 100000, 500);
    const canvas = setup.init();
    const ctx = setup.getContext();

    // Get the container after it's been created in init()
    const container = document.getElementById('excel-container') as HTMLDivElement;

    const gridMatrix = new GridMatrix(ctx, 100000, 500);
    gridMatrix.drawGrid(ctx);

    const resizer = new GridResizer(canvas, ctx, gridMatrix);
    const cellSelector = new CellSelector(canvas, ctx, gridMatrix);
    resizer.setCellSelector(cellSelector);

    canvas.tabIndex = 0;
    canvas.focus();

    const gridDataLoader = new GridDataLoader(gridMatrix);
    const dataGen = new GridDataGen(200);
    const sampleData = dataGen.generateData();
    gridDataLoader.loadJSONData(sampleData);

    const rowSelector = new RowSelector(ctx, gridMatrix);
    rowSelector.attachEvents(canvas);

    const colSelector = new ColumnSelector(ctx, gridMatrix);
    colSelector.attachEvents(canvas);

    const sumBtn = document.getElementById("calc-sum");
    const operations = new Operations(rowSelector, colSelector, gridMatrix, ctx);
    sumBtn?.addEventListener("click", operations.sumRows.bind(operations));

    function drawVisibleGrid() {
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const viewport = gridMatrix.getViewportBounds(scrollLeft, scrollTop, viewportWidth, viewportHeight);
        gridMatrix.drawGrid(ctx, viewport);

        cellSelector.drawSelection(ctx);
        rowSelector.drawSelection?.(ctx); // if you use row selection
        colSelector.drawSelection?.(ctx); // if you use column selection

    }

    container.addEventListener('scroll', drawVisibleGrid);

    // Assign the viewport draw to all selectors and resizer
    cellSelector.setRedrawGridCallback(drawVisibleGrid);
    rowSelector.redrawGrid = drawVisibleGrid;
    colSelector.redrawGrid = drawVisibleGrid;
    resizer.setRedrawGridCallback(drawVisibleGrid);

    drawVisibleGrid()
};