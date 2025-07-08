import { SetupExcelSheet } from "./SetupExcelSheet";

export class CanvasManager {

    NUM_ROWS = 1000;
    NUM_COLS = 100;
    CELL_W = 70;
    CELL_H = 25;
    canvas_id: number = 0;
    canvasStore: Map<number,SetupExcelSheet> = new Map();

    constructor(){
        this.canvas_id = this.canvas_id++;
    }

    canvasFactory() {
        const setup = new SetupExcelSheet(this.CELL_W, this.CELL_H, this.NUM_ROWS, this.NUM_COLS, window.innerWidth, window.innerHeight);
        this.canvasStore.set(this.canvas_id, setup);
        return setup;
    }

    getCanvas(id: number){
        const canvasSetup = this.canvasStore.get(id);
        return canvasSetup;
    }
}