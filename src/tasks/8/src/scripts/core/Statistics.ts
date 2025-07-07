import { CellSelector } from "./CellSelector";
import { GridMatrix } from "./GridMatrix";

export class Statistics {
    private cellSelector: CellSelector;
    private gridMatrix: GridMatrix;
    private bar: HTMLDivElement;

    constructor(cellSelector: CellSelector, gridMatrix: GridMatrix) {
        this.cellSelector = cellSelector;
        this.gridMatrix = gridMatrix;
        this.bar = document.createElement("div");
        this.bar.className = "statistics-bar";
        this.bar.style.position = "fixed";
        this.bar.style.left = "0";
        this.bar.style.right = "0";
        this.bar.style.bottom = "0";
        this.bar.style.height = "36px";
        this.bar.style.background = "#fafafa";
        this.bar.style.borderTop = "1px solid #ddd";
        this.bar.style.boxShadow = "0 -2px 4px rgba(0,0,0,0.03)";
        this.bar.style.display = "flex";
        this.bar.style.alignItems = "center";
        this.bar.style.padding = "0 24px";
        this.bar.style.fontFamily = "Segoe UI, Arial, sans-serif";
        this.bar.style.fontSize = "14px";
        this.bar.style.color = "#333";
        this.bar.style.zIndex = "999";
        document.body.appendChild(this.bar);

        // Hook into grid redraw (after every redraw, update stats bar)
        const origRedraw = this.cellSelector.redrawGrid.bind(this.cellSelector);
        this.cellSelector.redrawGrid = () => {
            origRedraw();
            this.updateStatistics();
        };
        // Also update when edit finishes, in case data changes
        this.cellSelector.onCellEditFinish = () => this.updateStatistics();

        // Initial state
        this.updateStatistics();
    }

    private updateStatistics() {
        const sel = this.cellSelector.getRangeSelectionData();
        if (
            !sel ||
            sel.startRow < 1 || sel.endRow < 1 ||
            sel.startCol < 1 || sel.endCol < 1 ||
            (sel.startRow === sel.endRow && sel.startCol === sel.endCol)
        ) {
            this.bar.textContent = "";
            return;
        }

        // Gather all cell values in the selected range
        let values: number[] = [];
        for (let row = Math.min(sel.startRow, sel.endRow); row <= Math.max(sel.startRow, sel.endRow); ++row) {
            for (let col = Math.min(sel.startCol, sel.endCol); col <= Math.max(sel.startCol, sel.endCol); ++col) {
                const cell = this.gridMatrix.getCell(row, col);
                const n = parseFloat(cell.data ?? "");
                if (!isNaN(n)) values.push(n);
            }
        }
        const count = values.length;
        if (count === 0) {
            this.bar.textContent = "";
            return;
        }
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = count ? sum / count : 0;
        const min = Math.min(...values);
        const max = Math.max(...values);

        this.bar.innerHTML = `
            <span style="margin-right: 28px;"><b>Sum:</b> ${sum}</span>
            <span style="margin-right: 28px;"><b>Avg:</b> ${avg}</span>
            <span style="margin-right: 28px;"><b>Count:</b> ${count}</span>
            <span style="margin-right: 28px;"><b>Min:</b> ${min}</span>
            <span style="margin-right: 28px;"><b>Max:</b> ${max}</span>
        `;
    }
}