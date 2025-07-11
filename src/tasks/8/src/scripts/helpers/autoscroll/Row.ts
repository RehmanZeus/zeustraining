import { RowSelector } from "../../core/RowSelector";
import { RowSelectorStrategy } from "../../core/strategies/RowSelectorStrategy";

export class Row {
    private rowSelector: RowSelector;
    private rowSelectorStrategy: RowSelectorStrategy;
    // Autoscroll state
    private autoscrollInterval: number | null = null;
    private AUTOSCROLL_EDGE_THRESHOLD = 35; // px from edge to trigger autoscroll
    private AUTOSCROLL_BASE_SPEED = 10;     // px per interval at edge
    private AUTOSCROLL_MAX_SPEED = 40;     // px per interval at far edge
    private AUTOSCROLL_INTERVAL_MS = 16;    // ms
    private lastPointerEvent: PointerEvent | null = null;


    constructor(r: RowSelector, rs: RowSelectorStrategy) {
        this.rowSelector = r;
        this.rowSelectorStrategy = rs;
    }


    /**
   * Checks if the pointer is near the edge of the container to trigger autoscroll.
   * @param e PointerEvent from the mouse movement
   * */
    checkAutoScroll(e: PointerEvent) {
        if (!this.rowSelector.canvas) return;
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const rect = container.getBoundingClientRect();
        this.lastPointerEvent = e;

        const topEdge = rect.top + this.AUTOSCROLL_EDGE_THRESHOLD;
        const bottomEdge = rect.bottom - this.AUTOSCROLL_EDGE_THRESHOLD;
        const pointerY = e.clientY;

        let scrollDir = 0;

        if (pointerY < topEdge) {
            scrollDir = -1;
        } else if (pointerY > bottomEdge) {
            scrollDir = 1;
        }

        if (scrollDir !== 0) {
            if (this.autoscrollInterval === null) {
                this.autoscrollInterval = window.setInterval(() => {
                    const pointer = this.lastPointerEvent || e;
                    const pointerY = pointer.clientY;

                    let accelSpeed = this.AUTOSCROLL_BASE_SPEED;
                    if (scrollDir === -1) {
                        accelSpeed = this.autoscrollSpeed(pointerY - rect.top);
                    } else if (scrollDir === 1) {
                        accelSpeed = this.autoscrollSpeed(rect.bottom - pointerY);
                    }

                    const maxScrollTop = container.scrollHeight - container.clientHeight;
                    let newScrollTop = container.scrollTop + scrollDir * accelSpeed;
                    newScrollTop = Math.max(0, Math.min(maxScrollTop, newScrollTop));

                    container.scrollTo({ top: newScrollTop, behavior: "instant" });

                    // Simulate a move event at the last pointer position
                    const fakeEvent = new PointerEvent('pointermove', {
                        clientX: pointer.clientX,
                        clientY: pointerY,
                        bubbles: true
                    });
                    this.rowSelectorStrategy.onPointerMove(fakeEvent);
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
    // --- END AUTOSCROLL LOGIC ---

}