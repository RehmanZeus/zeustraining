import { CellSelector } from "../../core/CellSelector";

export class Cell {
    private cellSelector: CellSelector;

    private autoscrollInterval: number | null = null;
    private AUTOSCROLL_EDGE_THRESHOLD = 35; // px from edge to trigger autoscroll
    private AUTOSCROLL_BASE_SPEED = 30;     // px per interval at edge
    private AUTOSCROLL_MAX_SPEED = 80;     // px per interval at far edge
    private AUTOSCROLL_INTERVAL_MS = 50;    // ms

    private lastPointerEvent: PointerEvent | null = null;


    constructor(c: CellSelector) {
        this.cellSelector = c;
    }

    checkAutoScroll(e: PointerEvent) {
        const container = document.getElementById('excel-container') as HTMLDivElement;
        const rect = container.getBoundingClientRect();
        const pointerX = e.clientX;
        const pointerY = e.clientY;

        // Always update lastPointerEvent!
        this.lastPointerEvent = e;

        const leftEdge = rect.left + this.AUTOSCROLL_EDGE_THRESHOLD;
        const rightEdge = rect.right - this.AUTOSCROLL_EDGE_THRESHOLD;
        const topEdge = rect.top + this.AUTOSCROLL_EDGE_THRESHOLD;
        const bottomEdge = rect.bottom - this.AUTOSCROLL_EDGE_THRESHOLD;

        let scrollDirX = 0, scrollDirY = 0;
        let accelSpeedX = this.AUTOSCROLL_BASE_SPEED, accelSpeedY = this.AUTOSCROLL_BASE_SPEED;

        if (pointerX < leftEdge) {
            scrollDirX = -1;
            accelSpeedX = this.autoscrollSpeed(pointerX - rect.left);
        } else if (pointerX > rightEdge) {
            scrollDirX = 1;
            accelSpeedX = this.autoscrollSpeed(rect.right - pointerX);
        }

        if (pointerY < topEdge) {
            scrollDirY = -1;
            accelSpeedY = this.autoscrollSpeed(pointerY - rect.top);
        } else if (pointerY > bottomEdge) {
            scrollDirY = 1;
            accelSpeedY = this.autoscrollSpeed(rect.bottom - pointerY);
        }

        if (scrollDirX !== 0 || scrollDirY !== 0) {
            if (this.autoscrollInterval === null) {
                this.autoscrollInterval = window.setInterval(() => {
                    const maxScrollLeft = container.scrollWidth - container.clientWidth;
                    const maxScrollTop = container.scrollHeight - container.clientHeight;

                    // Use latest pointer position!
                    const pointer = this.lastPointerEvent;
                    let px = pointer ? pointer.clientX : rect.left;
                    let py = pointer ? pointer.clientY : rect.top;

                    // Clamp pointer position to grid area if needed (optional)
                    px = Math.max(rect.left, Math.min(rect.right, px));
                    py = Math.max(rect.top, Math.min(rect.bottom, py));

                    // Update speed for smooth acceleration
                    let speedX = accelSpeedX;
                    let speedY = accelSpeedY;
                    if (scrollDirX === -1) {
                        speedX = this.autoscrollSpeed(px - rect.left);
                    } else if (scrollDirX === 1) {
                        speedX = this.autoscrollSpeed(rect.right - px);
                    }
                    if (scrollDirY === -1) {
                        speedY = this.autoscrollSpeed(py - rect.top);
                    } else if (scrollDirY === 1) {
                        speedY = this.autoscrollSpeed(rect.bottom - py);
                    }

                    container.scrollTo({
                        left: Math.max(0, Math.min(maxScrollLeft, container.scrollLeft + scrollDirX * speedX)),
                        top: Math.max(0, Math.min(maxScrollTop, container.scrollTop + scrollDirY * speedY)),
                        behavior: 'instant'
                    });

                    // Fire a synthetic pointermove to update selection/range
                    const fakeEvent = new PointerEvent('pointermove', {
                        clientX: px,
                        clientY: py,
                        bubbles: true
                    });
                    this.cellSelector.onPointerMove(fakeEvent);

                    // Always redraw grid
                    this.cellSelector.redrawGrid();
                }, this.AUTOSCROLL_INTERVAL_MS);
            }
        } else {
            this.clearAutoScroll();
        }
    }

    autoscrollSpeed(distanceFromEdge: number): number {
        let d = Math.max(0, this.AUTOSCROLL_EDGE_THRESHOLD - distanceFromEdge);
        let speed = this.AUTOSCROLL_BASE_SPEED + d * 1.5;
        return Math.min(this.AUTOSCROLL_MAX_SPEED, Math.max(this.AUTOSCROLL_BASE_SPEED, speed));
    }

    clearAutoScroll() {
        if (this.autoscrollInterval !== null) {
            clearInterval(this.autoscrollInterval);
            this.autoscrollInterval = null;
        }
    }
}