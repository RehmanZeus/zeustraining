import { CellSelector } from "./CellSelector.js";
import { CommandManager } from "./commands/CommandManager.js";
import { GridCell } from "./GridCell.js";
import { GridMatrix } from "./GridMatrix.js";
import { Operations } from "./Operations.js";

/**
 * ExcelHeader manages the header UI above the grid,
 * including cell reference, input box, and operations menu.
 */
export class ExcelHeader {

  /**
   * The HTML elements that make up the header.
   */
  container: HTMLDivElement;
  /**
   * The HTML elements for displaying cell reference, input box, and selection info.
   */
  refDisplay: HTMLDivElement;
  /**
   * The input box for editing cell data directly from the header.
   */
  inputBox: HTMLInputElement;
  /**
   * The HTML element showing selection details (e.g., Row:1, Col:1 or 2R x 3C).
   */
  selectionInfo: HTMLDivElement;
  /**
   * The operations menu containing buttons for common operations (Sum, Average, Count, Clear).
   */
  operationsMenu: HTMLDivElement;

  /**
   * The CellSelector instance for managing cell selection and editing.
   */
  cellSelector: CellSelector;
  /**
   * The GridMatrix instance for managing grid data and cell operations.
   */
  gridMatrix: GridMatrix;
  /**
   * The Operations instance for performing operations on the grid.
   */
  operations: Operations;
  /**
   * The CommandManager instance for managing undo/redo operations.
   */
  commandManager: CommandManager;

  /**
   * Flags to ignore input events from the header input box and cell editor.
   * This prevents feedback loops when both are trying to update the same cell data.
   */
  ignoreHeaderInput: boolean = false;
  /**
   * Flag to ignore input events from the cell editor when updating the header input box.
   * This prevents overwriting user input while they are typing in the cell editor.
   */
  ignoreCellInput: boolean = false;

  /**
   * Creates an instance of ExcelHeader.
   * @param cellSelector The CellSelector instance for managing cell selection.
   * @param gridMatrix The GridMatrix instance for managing grid data.
   * @param operations The Operations instance for managing grid operations.
   */
  constructor(
    cellSelector: CellSelector,
    gridMatrix: GridMatrix,
    operations: Operations,
    commandManager: CommandManager
  ) {
    this.cellSelector = cellSelector;
    this.gridMatrix = gridMatrix;
    this.operations = operations;
    this.commandManager = commandManager;

    // Create header container
    this.container = document.createElement("div");
    this.container.className = "excel-header";

    // Operations menu (Sum, Average, Count, Clear)
    this.operationsMenu = document.createElement("div");
    this.operationsMenu.className = "operations-menu";
    ["Undo", "Redo", "Sum", "Average", "Count", "Clear"].forEach((label) => {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = label;
      btn.addEventListener("click", () => {
        let value: number | undefined;
        switch (label) {
          case "Sum": value = this.operations.rangeSelectionSum(); break;
          case "Average":
            const sum = this.operations.rangeSelectionSum();
            const data = this.cellSelector.getRangeSelectionData();
            const count = data
              ? (data.endRow - data.startRow + 1) * (data.endCol - data.startCol + 1)
              : 0;
            value = count > 0 ? Math.floor(sum / count) : 0;
            break;
          case "Count":
            const r = this.cellSelector.getRangeSelectionData();
            if (r) {
              let count = 0;
              for (let i = r.startRow; i <= r.endRow; ++i) {
                for (let j = r.startCol; j <= r.endCol; ++j) {
                  const cell = this.gridMatrix.getCell(i, j);
                  if (cell.data) count++;
                }
              }
              value = count;
            } else {
              value = 0;
            }
            break;
          case "Undo":
            commandManager.undo();
            break;
          case "Redo":
            commandManager.redo();
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
    this.inputBox.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.commitHeaderInput();
        this.inputBox.blur();
      }
    });
    this.inputBox.addEventListener("blur", () => {
      this.commitHeaderInput();
    });
    this.inputBox.addEventListener("focus", () => {
      // Hide floating in-cell editor if header gets focus
      this.cellSelector.cancelEditing();
    });

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

    // Listen to the floating cell editor input for live sync
    if (this.cellSelector.inputElement) {
      this.cellSelector.inputElement.addEventListener("input", (e) => {
        this.syncCellToHeader();
      });
      this.cellSelector.inputElement.addEventListener("focus", () => {
        // When cell editor is shown, sync header input, and prevent feedback loop
        this.syncCellToHeader();
      });
    }

    // When cell editing starts, sync inputBox
    this.cellSelector.onCellEdit = (val: string) => {
      this.syncCellToHeader();
    };

    this.updateHeader();
  }

  /**
   * Handles input box changes to update the selected cell's data and the cell editor, if open.
   * This is called when the user types in the input box.
   */
  private handleInputBoxInput() {
    if (this.ignoreHeaderInput) return;
    const r = this.cellSelector.selectedRow;
    const c = this.cellSelector.selectedCol;
    if (r > 0 && c > 0) {
      // 1. Update data
      const cell = this.gridMatrix.getCell(r, c);
      cell.data = this.inputBox.value;

      // 2. If the floating cell editor is open, sync its value too
      if (
        this.cellSelector.inputElement &&
        this.cellSelector.inputElement.style.display !== 'none' &&
        document.activeElement !== this.cellSelector.inputElement // Don't overwrite if user is typing in floating input!
      ) {
        this.ignoreCellInput = true;
        this.cellSelector.inputElement.value = this.inputBox.value;
        this.ignoreCellInput = false;
      }
    }
  }

  private commitHeaderInput() {
    const r = this.cellSelector.selectedRow;
    const c = this.cellSelector.selectedCol;
    if (r > 0 && c > 0) {
      const cell = this.gridMatrix.getCell(r, c);
      cell.data = this.inputBox.value;
      this.cellSelector.redrawGrid();
    }
  }

  private syncCellToHeader() {
    if (this.ignoreCellInput) return;
    const r = this.cellSelector.selectedRow;
    const c = this.cellSelector.selectedCol;
    if (r > 0 && c > 0) {
      if (this.cellSelector.inputElement && this.cellSelector.inputElement.style.display !== 'none') {
        this.ignoreHeaderInput = true;
        this.inputBox.value = this.cellSelector.inputElement.value;
        this.ignoreHeaderInput = false;
      }
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
      this.selectionInfo.textContent = `Row: ${r > 0 ? r : "—"}, Col: ${c > 0 ? c : "—"}`;
      // Only update inputBox if not focused (avoid overwriting while editing)
      if (document.activeElement !== this.inputBox) {
        this.inputBox.value = this.cellSelector.getSelectedCellData() || "";
      }
    } else {
      this.refDisplay.textContent = "Range";
      const rows = (Math.max(sel.startRow, sel.endRow) - Math.min(sel.startRow, sel.endRow)) + 1;
      const cols = (Math.max(sel.endCol, sel.startCol) - Math.min(sel.startCol, sel.endCol)) + 1;
      this.selectionInfo.textContent = `${rows}R x ${cols}C`;
      this.inputBox.value = "";
    }
  }
}