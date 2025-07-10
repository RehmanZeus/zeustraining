import { ColumnSelector } from "../../core/ColumnSelector";
import { ColumnSelectorStrategy } from "../../core/strategies/ColumnSelectorStrategy";

export class Column {
    
    private columnSelector: ColumnSelector;
    private colSelectorStrategy: ColumnSelectorStrategy;
    private autoscrollInterval: number | null = null;
    private AUTOSCROLL_EDGE_THRESHOLD = 35; // px from edge to trigger autoscroll
    private AUTOSCROLL_BASE_SPEED = 10;     // px per interval at edge
    private AUTOSCROLL_MAX_SPEED = 40;     // px per interval at far edge
    private AUTOSCROLL_INTERVAL_MS = 16;    // ms
    private lastPointerEvent: PointerEvent | null = null;

    constructor(c: ColumnSelector, cStr: ColumnSelectorStrategy) {
        this.columnSelector = c;
        this.colSelectorStrategy = cStr;
    }

    checkAutoScroll(e: PointerEvent) {
        if (!this.columnSelector.canvas) return;
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const rect = container.getBoundingClientRect();
        this.lastPointerEvent = e;

        const leftEdge = rect.left + this.AUTOSCROLL_EDGE_THRESHOLD;
        const rightEdge = rect.right - this.AUTOSCROLL_EDGE_THRESHOLD;

        let scrollDir = 0;

        if (e.clientX < leftEdge) {
            scrollDir = -1;
        } else if (e.clientX > rightEdge) {
            scrollDir = 1;
        }

        if (scrollDir !== 0) {
            if (this.autoscrollInterval === null) {
                this.autoscrollInterval = window.setInterval(() => {
                    // Always use the latest pointer position!
                    const pointer = this.lastPointerEvent || e;
                    const pointerX = pointer.clientX;

                    let accelSpeed = this.AUTOSCROLL_BASE_SPEED;
                    if (scrollDir === -1) {
                        accelSpeed = this.autoscrollSpeed(pointerX - rect.left);
                    } else if (scrollDir === 1) {
                        accelSpeed = this.autoscrollSpeed(rect.right - pointerX);
                    }

                    const maxScrollLeft = container.scrollWidth - container.clientWidth;
                    let newScrollLeft = container.scrollLeft + scrollDir * accelSpeed;
                    newScrollLeft = Math.max(0, Math.min(maxScrollLeft, newScrollLeft));

                    // --- INSTANT scroll ---
                    container.scrollTo({ left: newScrollLeft, behavior: "instant" });

                    // Simulate a move event at the last pointer position
                    const fakeEvent = new PointerEvent('pointermove', {
                        clientX: pointerX,
                        clientY: pointer.clientY,
                        bubbles: true
                    });
                    this.colSelectorStrategy.onPointerMove(fakeEvent);
                }, this.AUTOSCROLL_INTERVAL_MS);
            }
        } else {
            this.clearAutoScroll();
        }
    }

    // Acceleration: further from edge = faster scroll, up to max speed
    autoscrollSpeed(distanceFromEdge: number): number {
        let d = Math.max(0, this.AUTOSCROLL_EDGE_THRESHOLD - distanceFromEdge);
        let speed = this.AUTOSCROLL_BASE_SPEED + d;
        return Math.min(this.AUTOSCROLL_MAX_SPEED, Math.max(this.AUTOSCROLL_BASE_SPEED, speed));
    }

    clearAutoScroll() {
        if (this.autoscrollInterval !== null) {
            clearInterval(this.autoscrollInterval);
            this.autoscrollInterval = null;
        }
    }

}