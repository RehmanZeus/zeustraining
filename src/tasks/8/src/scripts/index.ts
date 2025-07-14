import { Calculations } from "./core/Calculations.js";
import { CellSelector } from "./core/CellSelector.js";
import { ColumnResizer } from "./core/ColumnResizer.js";
import { ColumnSelector } from "./core/ColumnSelector.js";
import { CommandManager } from "./core/commands/CommandManager.js";
import { EventManager } from "./core/EventManager.js";
import { ExcelHeader } from "./core/ExcelHeader.js";
import { GridDataGen } from "./core/GridDataGen.js";
import { GridDataLoader } from "./core/GridDataLoader.js";
import { GridMatrix } from "./core/GridMatrix.js";
import { RowResizer } from "./core/RowResizer.js";
import { RowSelector } from "./core/RowSelector.js";
import { SetupExcelSheet } from "./core/SetupExcelSheet.js";
import { Statistics } from "./core/Statistics.js";
import { CellSelectionStrategy } from "./core/strategies/CellSelectionStrategy.js";
import { ColumnSelectorStrategy } from "./core/strategies/ColumnSelectorStrategy.js";
import { RowSelectorStrategy } from "./core/strategies/RowSelectorStrategy.js";
import { Cell } from "./helpers/autoscroll/Cell.js";
import { Column } from "./helpers/autoscroll/Column.js";
import { Row } from "./helpers/autoscroll/Row.js";

const NUM_ROWS = 1000, NUM_COLS = 300, CELL_W = 70, CELL_H = 25;

window.onload = () => setupGridApp();

function setupGridApp() {
    console.log("hello")
    const { canvas, ctx, container, gridMatrix } = createGridEnvironment();
    const commandManager = new CommandManager();

    const rowResizer = new RowResizer(canvas, ctx, gridMatrix);
    const colResizer = new ColumnResizer(canvas, ctx, gridMatrix);
    const cellSelector = new CellSelector(canvas, ctx, gridMatrix);

    const gridDataLoader = new GridDataLoader(gridMatrix);
    const dataGen = new GridDataGen(100);
    gridDataLoader.loadJSONData(dataGen.generateData());

    const rowSelector = new RowSelector(ctx, gridMatrix, cellSelector);
    const colSelector = new ColumnSelector(ctx, gridMatrix, cellSelector);

    connectSelectorsAndStrategies({
        cellSelector, rowSelector, colSelector, gridMatrix,
        commandManager, rowResizer, colResizer
    });

    const drawVisibleGrid = createDrawVisibleGrid({
        canvas, ctx, container, gridMatrix,
        rowResizer, colResizer, cellSelector, rowSelector, colSelector
    });

    setupRedrawCallbacks({
        cellSelector, rowSelector, colSelector,
        rowResizer, colResizer, drawVisibleGrid
    });

    attachUIEvents({
        container, drawVisibleGrid, canvas, commandManager
    });

    cellSelector.selectCell(1, 1);
    console.log("setup app")
    new EventManager(rowResizer, gridMatrix, colResizer, cellSelector, rowSelector, colSelector, canvas, container);
    new ExcelHeader(cellSelector, gridMatrix, commandManager,
    new Calculations(cellSelector, colSelector, rowSelector, gridMatrix, ctx, commandManager));
    new Statistics(cellSelector, gridMatrix);
}

function createGridEnvironment() {
    const setup = new SetupExcelSheet(CELL_W, CELL_H, NUM_ROWS, NUM_COLS, window.innerWidth, window.innerHeight);
    const canvas = setup.init();
    const ctx = setup.getContext();
    const container = document.getElementById('excel-container') as HTMLDivElement;
    const gridMatrix = new GridMatrix(ctx, NUM_ROWS, NUM_COLS);
    setup.setGridMatrix(gridMatrix);
    return { canvas, ctx, container, gridMatrix };
}

function connectSelectorsAndStrategies({
    cellSelector,
    rowSelector,
    colSelector,
    gridMatrix,
    commandManager,
    rowResizer,
    colResizer
}: {
    cellSelector: CellSelector,
    rowSelector: RowSelector,
    colSelector: ColumnSelector,
    gridMatrix: GridMatrix,
    commandManager: CommandManager,
    rowResizer: RowResizer,
    colResizer: ColumnResizer
}) {
    rowSelector.setCanvas(cellSelector.canvas);
    colSelector.setCanvas(cellSelector.canvas);

    const columnSelectorStrategy = new ColumnSelectorStrategy(colSelector, cellSelector, gridMatrix);
    const rowSelectorStrategy = new RowSelectorStrategy(rowSelector, cellSelector, gridMatrix);
    const cellSelectorStrategy = new CellSelectionStrategy(cellSelector);
    cellSelector.setColumnSelector(colSelector);
    cellSelector.setRowSelector(rowSelector);

    rowResizer.setCommandManager(commandManager);
    colResizer.setCommandManager(commandManager);
    colResizer.setCellSelector(cellSelector);
    colResizer.setColumnSelector(colSelector);
    rowResizer.setCellSelector(cellSelector);
    rowResizer.setRowSelector(rowSelector);

    colSelector.setColAutoScroll(new Column(colSelector, columnSelectorStrategy));
    rowSelector.setRowAutoScroll(new Row(rowSelector, rowSelectorStrategy));
    cellSelector.setCellAutoScroll(new Cell(cellSelector, gridMatrix, cellSelectorStrategy));;

    gridMatrix.setCellSelector(cellSelector);

    cellSelector.setCommangManager(commandManager);
}

function createDrawVisibleGrid({
    canvas, ctx, container, gridMatrix,
    rowResizer, colResizer, cellSelector, rowSelector, colSelector
}: {
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    container: HTMLDivElement,
    gridMatrix: GridMatrix,
    rowResizer: RowResizer,
    colResizer: ColumnResizer,
    cellSelector: CellSelector,
    rowSelector: RowSelector,
    colSelector: ColumnSelector
}) {
    function drawVisibleGrid() {
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const viewport = gridMatrix.getViewportBounds(scrollLeft, scrollTop, viewportWidth, viewportHeight);

        rowResizer.setViewportForRows(viewport.startRow, viewport.endRow);
        colResizer.setViewport(viewport.startCol, viewport.endCol);

        gridMatrix.drawGrid(ctx, viewport, scrollLeft, scrollTop);

        cellSelector.drawSelection(ctx, scrollLeft, scrollTop);
        if (rowSelector.drawSelection) rowSelector.drawSelection(ctx, scrollLeft, scrollTop);
        if (colSelector.drawSelection) colSelector.drawSelection(ctx, scrollLeft, scrollTop);

        drawCornerCell(ctx, gridMatrix);
    }
    return drawVisibleGrid;
}

function drawCornerCell(ctx: CanvasRenderingContext2D, gridMatrix: GridMatrix) {
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

function setupRedrawCallbacks({
    cellSelector, rowSelector, colSelector,
    rowResizer, colResizer, drawVisibleGrid
}: {
    cellSelector: CellSelector,
    rowSelector: RowSelector,
    colSelector: ColumnSelector,
    rowResizer: RowResizer,
    colResizer: ColumnResizer,
    drawVisibleGrid: () => void
}) {
    cellSelector.setRedrawGridCallback(drawVisibleGrid);
    rowSelector.redrawGrid = drawVisibleGrid;
    colSelector.redrawGrid = drawVisibleGrid;
    rowResizer.redrawGrid = drawVisibleGrid;
    colResizer.redrawGrid = drawVisibleGrid;
}

function attachUIEvents({
    container,
    drawVisibleGrid,
    canvas,
    commandManager
}: {
    container: HTMLDivElement,
    drawVisibleGrid: () => void,
    canvas: HTMLCanvasElement,
    commandManager: CommandManager
}) {
    let animationFrameId: number | null = null;
    container.addEventListener('scroll', () => {
        if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
            drawVisibleGrid();
            animationFrameId = null;
        });
    });

    window.addEventListener('resize', () => {
        drawVisibleGrid();
    });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') commandManager.undo();
        if (e.ctrlKey && e.key === 'y') commandManager.redo();
    });

    drawVisibleGrid();

    canvas.tabIndex = 0;
    canvas.focus();
}