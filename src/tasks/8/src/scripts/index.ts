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
import {SparseGridMatrix} from "./core/SparseGridMatrix.js"





window.onload = () => {
    const setup = new SetupExcelSheet(MIN_GRIDCELL_WIDTH, MIN_GRIDCELL_HEIGHT, 200, 50);
    const canvas = setup.init();
    const ctx = setup.getContext();

    const gridMatrix = new GridMatrix(ctx, 200, 50);
    gridMatrix.drawGrid(ctx);

    const resizer = new GridResizer(canvas, ctx, gridMatrix);
    const cellSelector = new CellSelector(canvas, ctx, gridMatrix);
    resizer.setCellSelector(cellSelector);

    // const cellMullti = new CellMultiSelector(ctx, gridMatrix);
    // cellMullti.attachEvents(canvas)
    // Make canvas focusable for keyboard events
    canvas.tabIndex = 0;
    canvas.focus();

    // 1. Create loader
    const gridDataLoader = new GridDataLoader(gridMatrix);

    // 2. Load sample data
    const dataGen = new GridDataGen(200);
    const sampleData = dataGen.generateData();
    console.log(sampleData)
    gridDataLoader.loadJSONData(sampleData);

    const rowSelector = new RowSelector(ctx, gridMatrix);
    rowSelector.attachEvents(canvas);

    const colSelector = new ColumnSelector(ctx, gridMatrix);
    colSelector.attachEvents(canvas);
    const sumBtn = document.getElementById("calc-sum");
    const operations = new Operations(rowSelector, colSelector, gridMatrix, ctx);
    sumBtn?.addEventListener("click", operations.sumRows.bind(operations));

    // 3. Redraw grid to show new data
    cellSelector.redrawGrid();
};
