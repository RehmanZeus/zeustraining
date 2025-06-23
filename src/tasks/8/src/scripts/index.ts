import { MIN_GRIDCELL_HEIGHT, MIN_GRIDCELL_WIDTH } from "./constants.js";
import { CellSelector } from "./core/CellSelector.js";
import { GridDataLoader } from "./core/GridDataLoader.js";
import { GridMatrix } from "./core/GridMatrix.js";
import { GridResizer } from "./core/GridResizer.js";
import { SetupExcelSheet } from "./core/SetupExcelSheet.js";





window.onload = () => {
    const setup = new SetupExcelSheet(MIN_GRIDCELL_WIDTH, MIN_GRIDCELL_HEIGHT, 50, 50);
    const canvas = setup.init();
    const ctx = setup.getContext();

    const gridMatrix = new GridMatrix(ctx, 50, 50);
    gridMatrix.drawGrid(ctx);

    const resizer = new GridResizer(canvas, ctx, gridMatrix);
    const cellSelector = new CellSelector(canvas, ctx, gridMatrix);
    resizer.setCellSelector(cellSelector);

    // Make canvas focusable for keyboard events
    canvas.tabIndex = 0;
    canvas.focus();

    // 1. Create loader
    const gridDataLoader = new GridDataLoader(gridMatrix);

    // 2. Load sample data
    const sampleData = [
        {
            "id": 1,
            "firstName": "Raj",
            "lastName": "Solanki",
            "Age": 30,
            "Salary": 1000000
        }
    ];
    gridDataLoader.loadJSONData(sampleData);

    // 3. Redraw grid to show new data
    cellSelector.redrawGrid();
};
