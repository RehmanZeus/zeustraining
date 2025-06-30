import { CellSelector } from "./CellSelector.js";
import { GridMatrix } from "./GridMatrix.js";
import { Operations } from "./Operations.js";

/**
 * ExcelHeader manages the header UI above the grid,
 * including cell reference, input box, and operations menu.
 */
export class ExcelHeader {
  container: HTMLDivElement;
  refDisplay: HTMLDivElement;
  inputBox: HTMLInputElement;
  selectionInfo: HTMLDivElement;
  operationsMenu: HTMLDivElement;

  cellSelector: CellSelector;
  gridMatrix: GridMatrix;
  operations: Operations;

  /**
   * Creates an instance of ExcelHeader.
   * @param cellSelector The CellSelector instance for managing cell selection.
   * @param gridMatrix The GridMatrix instance for managing grid data.
   * @param operations The Operations instance for managing grid operations.
   */
  constructor(
    cellSelector: CellSelector,
    gridMatrix: GridMatrix,
    operations: Operations
  ) {
    this.cellSelector = cellSelector;
    this.gridMatrix = gridMatrix;
    this.operations = operations;

    // Create header container
    this.container = document.createElement("div");
    this.container.className = "excel-header";

    // Operations menu (Sum, Average, Count, Clear)
    this.operationsMenu = document.createElement("div");
    this.operationsMenu.className = "operations-menu";
    ["Sum","Average","Count","Clear"].forEach((label) => {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = label;
      btn.addEventListener("click", () => {
        let value: number|undefined;
        switch(label) {
          case "Sum": value = this.operations.rangeSelectionSum(); break;
          case "Average":
            const sum = this.operations.rangeSelectionSum();
            const data = this.cellSelector.getRangeSelectionData();
            const count = data
              ? (data.endRow - data.startRow + 1) * (data.endCol - data.startCol + 1)
              : 0;
            value = count>0 ? Math.floor(sum / count) : 0;
            break;
          case "Count":
            const r = this.cellSelector.getRangeSelectionData();
            value = r
              ? (r.endRow - r.startRow + 1) * (r.endCol - r.startCol + 1)
              : 0;
            break;
          case "Clear":
            this.inputBox.value = "";
            this.cellSelector.clearSelectedCell();
            this.cellSelector.redrawGrid();
            return;
        }
        this.inputBox.value = (value ?? 0).toString();
      });
      this.operationsMenu.appendChild(btn);
    });

    // Cell reference display (e.g. A1 or Range)
    this.refDisplay = document.createElement("div");
    this.refDisplay.className = "cell-ref";

    // Selection details (Row:1, Col:1 or 2R x 3C)
    this.selectionInfo = document.createElement("div");
    this.selectionInfo.className = "selection-info";

    // Input box for direct cell editing
    this.inputBox = document.createElement("input");
    this.inputBox.className = "cell-input";
    this.inputBox.type = "text";
    this.inputBox.addEventListener("input", this.handleInputBoxInput.bind(this));

    // Assemble header
    this.container.append(
      this.operationsMenu,
      this.refDisplay,
      this.selectionInfo,
      this.inputBox
    );

    // Insert above the excel container
    const excelContainer = document.getElementById("excel-container");
    if (excelContainer && excelContainer.parentElement) {
      excelContainer.parentElement.insertBefore(this.container, excelContainer);
    } else {
      document.body.insertBefore(this.container, document.body.firstChild);
    }

    // Hook into selection/edit events to refresh header
    const origSelect = this.cellSelector.selectCell.bind(this.cellSelector);
    this.cellSelector.selectCell = (r, c) => {
      origSelect(r, c);
      this.updateHeader();
    };
    const origRedraw = this.cellSelector.redrawGrid.bind(this.cellSelector);
    this.cellSelector.redrawGrid = () => {
      origRedraw();
      this.updateHeader();
    };
    this.cellSelector.onCellEditFinish = () => this.updateHeader();

    this.updateHeader();
  }

  /**
   * Handles input box changes to update the selected cell's data.
   * This is called when the user types in the input box.
   */
  private handleInputBoxInput() {
    const r = this.cellSelector.selectedRow;
    const c = this.cellSelector.selectedCol;
    if (r > 0 && c > 0) {
      const cell = this.gridMatrix.getCell(r, c);
      cell.data = this.inputBox.value;
      this.cellSelector.redrawGrid();
    }
  }

  /**
   * Updates the header display with the current selection information.
   */
  private updateHeader() {
    // Range?
    const sel = this.cellSelector.getRangeSelectionData();
    const isRange = sel != null && (
      sel.startRow !== sel.endRow || sel.startCol !== sel.endCol
    );

    if (!isRange) {
      const ref = this.cellSelector.getSelectedCellReference() || "—";
      const r = this.cellSelector.selectedRow;
      const c = this.cellSelector.selectedCol;
      this.refDisplay.textContent = `Cell: ${ref}`;
      this.selectionInfo.textContent = `Row: ${r>0?r:"—"}, Col: ${c>0?c:"—"}`;
      this.inputBox.value = this.cellSelector.getSelectedCellData() || "";
    } else {
      this.refDisplay.textContent = "Range";
      const rows = sel.endRow - sel.startRow + 1;
      const cols = sel.endCol - sel.startCol + 1;
      this.selectionInfo.textContent = `${rows}R x ${cols}C`;
      this.inputBox.value = "";
    }
  }
}