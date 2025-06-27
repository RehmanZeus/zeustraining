import { CellSelector } from "./CellSelector.js";
import { GridMatrix } from "./GridMatrix.js";

/**
 * ExcelHeader manages the header UI above the grid,
 * including cell reference, input box, color picker, and selection info.
 */
export class ExcelHeader {
    container: HTMLDivElement;
    refDisplay: HTMLDivElement;
    inputBox: HTMLInputElement;
    colorPicker: HTMLInputElement;
    selectionInfo: HTMLDivElement;

    cellSelector: CellSelector;
    gridMatrix: GridMatrix;

    constructor(cellSelector: CellSelector, gridMatrix: GridMatrix) {
        this.cellSelector = cellSelector;
        this.gridMatrix = gridMatrix;

        // Create header elements
        this.container = document.createElement("div");
        this.container.className = "excel-header";

        this.refDisplay = document.createElement("div");
        this.refDisplay.className = "cell-ref";
        this.refDisplay.textContent = "";

        this.selectionInfo = document.createElement("div");
        this.selectionInfo.className = "selection-info";
        this.selectionInfo.textContent = "";

        this.inputBox = document.createElement("input");
        this.inputBox.className = "cell-input";
        this.inputBox.type = "text";

        this.colorPicker = document.createElement("input");
        this.colorPicker.type = "color";
        this.colorPicker.className = "color-picker";

        this.container.appendChild(this.refDisplay);
        this.container.appendChild(this.selectionInfo);
        this.container.appendChild(this.inputBox);
        this.container.appendChild(this.colorPicker);

        // Insert above the excel-container
        const excelContainer = document.getElementById("excel-container");
        if (excelContainer && excelContainer.parentElement) {
            excelContainer.parentElement.insertBefore(this.container, excelContainer);
        } else {
            document.body.insertBefore(this.container, document.body.firstChild);
        }

        // Initial update
        this.updateHeader();

        // Events
        this.inputBox.addEventListener("input", this.handleInputBoxInput.bind(this));
        this.colorPicker.addEventListener("input", this.handleColorChange.bind(this));

        // Listen for selection changes by monkey-patching selectCell
        const origSelectCell = this.cellSelector.selectCell.bind(this.cellSelector);
        this.cellSelector.selectCell = (row: number, col: number) => {
            origSelectCell(row, col);
            this.updateHeader();
        };

        // Listen for range selection changes (e.g., after drag)
        const origRedraw = this.cellSelector.redrawGrid.bind(this.cellSelector);
        this.cellSelector.redrawGrid = () => {
            origRedraw();
            this.updateHeader();
        };

        this.cellSelector.onCellEdit = (value: string) => {
            this.inputBox.value = value;
        };
        this.cellSelector.onCellEditFinish = (value: string) => {
            this.inputBox.value = value;
            this.updateHeader();
        };
    }

    handleInputBoxInput(e: Event) {
        if (this.cellSelector.selectedRow > 0 && this.cellSelector.selectedCol > 0) {
            const cell = this.gridMatrix.getCell(
                this.cellSelector.selectedRow,
                this.cellSelector.selectedCol
            );
            cell.data = this.inputBox.value;
            // Sync to in-cell editor if open
            if (this.cellSelector.isEditing) {
                this.cellSelector.inputElement.value = this.inputBox.value;
            }
            this.cellSelector.redrawGrid();
        }
    }
    /**
     * 
     */
    updateHeader() {
        // Detect range selection
        const isRange = (
            this.cellSelector.selectionStartRow > 0 &&
            this.cellSelector.selectionStartCol > 0 &&
            (
                this.cellSelector.selectionStartRow !== this.cellSelector.selectionEndRow ||
                this.cellSelector.selectionStartCol !== this.cellSelector.selectionEndCol
            )
        );

        if (!isRange) {
            const ref = this.cellSelector.getSelectedCellReference();
            this.refDisplay.textContent = `Cell: ${ref}`;
            this.selectionInfo.textContent = `Row: ${this.cellSelector.selectedRow}, Col: ${this.cellSelector.selectedCol}`;
            this.inputBox.value = this.cellSelector.getSelectedCellData() || "";
        } else {
            const sr = this.cellSelector.selectionStartRow;
            const sc = this.cellSelector.selectionStartCol;
            const er = this.cellSelector.selectionEndRow;
            const ec = this.cellSelector.selectionEndCol;
            this.refDisplay.textContent = "Range";
            this.selectionInfo.textContent = `Rows: ${sr}-${er}, Cols: ${sc}-${ec} (${Math.abs(er - sr) + 1}R x ${Math.abs(ec - sc) + 1}C)`;
            this.inputBox.value = ""; // or maybe sum/count values in range?
        }
        // Color picker logic omitted for now
    }

   

    handleColorChange(e: Event) {
        // ...
    }
}