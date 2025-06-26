import { CellSelector } from "./CellSelector.js";
import { GridMatrix } from "./GridMatrix.js";

/**
 * ExcelHeader manages the header UI above the grid,
 * including cell reference, input box, and color picker.
 */
export class ExcelHeader {
    container: HTMLDivElement;
    refDisplay: HTMLDivElement;
    inputBox: HTMLInputElement;
    colorPicker: HTMLInputElement;

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

        this.inputBox = document.createElement("input");
        this.inputBox.className = "cell-input";
        this.inputBox.type = "text";

        this.colorPicker = document.createElement("input");
        this.colorPicker.type = "color";
        this.colorPicker.className = "color-picker";

        this.container.appendChild(this.refDisplay);
        this.container.appendChild(this.inputBox);
        this.container.appendChild(this.colorPicker);

        // Insert above the excel-container
        const excelContainer = document.getElementById("excel-container");
        if (excelContainer && excelContainer.parentElement) {
            excelContainer.parentElement.insertBefore(this.container, excelContainer);
        } else {
            // fallback: insert at top of body
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
    }

    updateHeader() {
        // Update cell reference display
        const ref = this.cellSelector.getSelectedCellReference();
        this.refDisplay.textContent = ref;

        // Update input box value
        this.inputBox.value = this.cellSelector.getSelectedCellData() || "";

        // Update color picker value (defaults to white if not set)
        let cell: any = null;
        if (this.cellSelector.selectedRow > 0 && this.cellSelector.selectedCol > 0) {
            cell = this.gridMatrix.getCell(
                this.cellSelector.selectedRow,
                this.cellSelector.selectedCol
            );
        }
        let color = "#ffffff";
        if (cell && cell.backgroundColor) {
            color = cell.backgroundColor;
        }
        this.colorPicker.value = color;
    }

    handleInputBoxInput(e: Event) {
        // Update selected cell data on input
        if (this.cellSelector.selectedRow > 0 && this.cellSelector.selectedCol > 0) {
            const cell = this.gridMatrix.getCell(
                this.cellSelector.selectedRow,
                this.cellSelector.selectedCol
            );
            cell.data = this.inputBox.value;
            this.cellSelector.redrawGrid();
        }
    }

    handleColorChange(e: Event) {
        if (this.cellSelector.selectedRow > 0 && this.cellSelector.selectedCol > 0) {
            const cell = this.gridMatrix.getCell(
                this.cellSelector.selectedRow,
                this.cellSelector.selectedCol
            );
            // cell.backgroundColor = this.colorPicker.value;
            // this.cellSelector.redrawGrid();
        }
    }
}