import { Calculations } from "./core/Calculations.js";
import { CellSelector } from "./core/CellSelector.js";
import { ColumnSelector } from "./core/ColumnSelector.js";
import { CommandManager } from "./core/commands/CommandManager.js";
import { EventManager } from "./core/EventManager.js";
import { ExcelHeader } from "./core/ExcelHeader.js";
import { GridDataGen } from "./core/GridDataGen.js";
import { GridDataLoader } from "./core/GridDataLoader.js";
import { GridMatrix } from "./core/GridMatrix.js";
import { GridResizer } from "./core/GridResizer.js";
import { Operations } from "./core/Operations.js";
import { RowSelector } from "./core/RowSelector.js";
import { SetupExcelSheet } from "./core/SetupExcelSheet.js";
import { Statistics } from "./core/Statistics.js";
import { Cell } from "./helpers/autoscroll/Cell.js";
import { Column } from "./helpers/autoscroll/Column.js";
import { Row } from "./helpers/autoscroll/Row.js";

const NUM_ROWS = 1000, NUM_COLS = 100, CELL_W = 70, CELL_H = 25;

window.onload = () => {
    console.log(window.innerHeight, window.innerWidth)
    const setup = new SetupExcelSheet(CELL_W, CELL_H, NUM_ROWS, NUM_COLS, window.innerWidth, window.innerHeight);
    const canvas = setup.init();
    const ctx = setup.getContext();
    const commandManager = new CommandManager();

    const container = document.getElementById('excel-container') as HTMLDivElement;
    const gridMatrix = new GridMatrix(ctx, NUM_ROWS, NUM_COLS);

    const resizer = new GridResizer(canvas, ctx, gridMatrix);
    const cellSelector = new CellSelector(canvas, ctx, gridMatrix);
    resizer.setCellSelector(cellSelector);

    const gridDataLoader = new GridDataLoader(gridMatrix);
    const dataGen = new GridDataGen(500);
    const sampleData = dataGen.generateData();
    gridDataLoader.loadJSONData(sampleData);

    setup.setGridMatrix(gridMatrix);

    const rowSelector = new RowSelector(ctx, gridMatrix, cellSelector);
    rowSelector.setCanvas(canvas);

    const colSelector = new ColumnSelector(ctx, gridMatrix, cellSelector);
    colSelector.setCanvas(canvas);

    cellSelector.setColumnSelector(colSelector);
    cellSelector.setRowSelector(rowSelector);

    const colAutoScroll = new Column(colSelector);
    const rowAutoScroll = new Row(rowSelector);
    const cellAutoScroll = new Cell(cellSelector, gridMatrix);

    colSelector.setColAutoScroll(colAutoScroll);
    rowSelector.setRowAutoScroll(rowAutoScroll);
    cellSelector.setCellAutoScroll(cellAutoScroll);

    const operations = new Operations(rowSelector, colSelector, gridMatrix, ctx, cellSelector);
    gridMatrix.setCellSelector(cellSelector);

    resizer.setCommandManager(commandManager);
    cellSelector.setCommangManager(commandManager);

    /**
     * Draws the visible grid area based on the current scroll position and viewport size.  
     * This function clears the canvas, calculates the viewport bounds, and draws the grid, selections, and corner cell.
     * It is called on scroll events and initial load to ensure the grid is rendered correctly.
     */
    function drawVisibleGrid() {
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const viewport = gridMatrix.getViewportBounds(scrollLeft, scrollTop, viewportWidth, viewportHeight);

        // Pass viewport to resizer before any pointer event
        resizer.setViewport(viewport.startCol, viewport.endCol, viewport.startRow, viewport.endRow);
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



    /**
     * Draws the top-left corner cell of the grid, which is used for selection.
     * @param ctx The canvas rendering context to draw the corner cell.
     * This function draws the top-left corner cell of the grid, which is used for selection
     */
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
    /**
     * Handles the scroll event for the container.
     */
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

    cellSelector.selectCell(1, 1)

    window.addEventListener('resize', () => {
        drawVisibleGrid();
    });

    const calcs = new Calculations(cellSelector, colSelector, rowSelector, gridMatrix, ctx, commandManager)

    // --- Attach all pointer/click events to EventAttacher! ---
    new EventManager(canvas, cellSelector, colSelector, rowSelector, resizer, gridMatrix);

    new ExcelHeader(cellSelector, gridMatrix, operations, commandManager, calcs);

    new Statistics(cellSelector, gridMatrix);
    /**
     * Handles the keydown event for the document.
     * This function listens for Ctrl+Z and Ctrl+Y key combinations to trigger undo and redo commands.
     * It uses the CommandManager to manage the command history and execute undo/redo operations
     */
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
            commandManager.undo();
        }
        if (e.ctrlKey && e.key === 'y') {
            commandManager.redo();
        }
    });

};