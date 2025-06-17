
class DivHandler {
    elem: HTMLElement;

    constructor(width: string, height: string) {
        this.elem = document.createElement("div");
        this.elem.style.width = width;
        this.elem.style.height = height;
    }

    addClass(name: string) {
        this.elem.classList.add(name);
    }

    getPosAndSize() {
        return this.elem.getBoundingClientRect();
    }

    appendChild(elem: HTMLElement) {
        this.elem.appendChild(elem);
    }

    setStyle(color: string, text: "", display: "block", bgColor: string){
        this.elem.style.color = color;
        this.elem.innerText = text;
        this.elem.style.display = display;
        this.elem.style.backgroundColor = bgColor;
    }
}

class WindowDiv extends DivHandler {
    constructor(width: string, height: string) {
        super(width, height);
    }
}

class DraggableDiv extends DivHandler {
    offsetX: number = 0;
    offsetY: number = 0;
    parent: WindowDiv;

    constructor(width: string, height: string, parent: WindowDiv) {
        super(width, height);
        this.parent = parent;
        this.elem.style.borderRadius = "50px"
        this.elem.style.backgroundColor = "cyan"
    }

    handleDown = (e: PointerEvent) => {
        this.offsetX = e.clientX - this.elem.offsetLeft;
        this.offsetY = e.clientY - this.elem.offsetTop;
        logger("DownHandler", e, this.elem);
        this.elem.setPointerCapture(e.pointerId);
        this.elem.onpointermove = this.handleMove;
    }

    handleMove = (e: PointerEvent) => {
        let newLeft = e.pageX - this.offsetX;
        let newTop = e.pageY - this.offsetY;

        const rect = this.parent.getPosAndSize();
        const draggableRect = this.getPosAndSize();

        if (newLeft < rect.left) newLeft = rect.left;
        if (newTop < rect.top) newTop = rect.top;
        if (newLeft + draggableRect.width > rect.right) newLeft = rect.right - draggableRect.width;
        if (newTop + draggableRect.height > rect.bottom) newTop = rect.bottom - draggableRect.height;

        this.elem.style.left = `${newLeft}px`;
        this.elem.style.top = `${newTop}px`;
    }

    handleUp = (e: PointerEvent) => {
        this.elem.releasePointerCapture(e.pointerId);
        this.elem.onpointermove =null;
    }

    init() {
        this.elem.onpointerdown = this.handleDown;
        this.elem.onpointerup = this.handleUp;
    }

    adjustPosition() {
        const rect = this.parent.getPosAndSize();
        const draggableRect = this.getPosAndSize();

        let newLeft = this.elem.offsetLeft;
        let newTop = this.elem.offsetTop;

        if (newLeft < rect.left) newLeft = rect.left;
        if (newTop < rect.top) newTop = rect.top;
        if (newLeft + draggableRect.width > rect.right) newLeft = rect.right - draggableRect.width;
        if (newTop + draggableRect.height > rect.bottom) newTop = rect.bottom - draggableRect.height;

        this.elem.style.left = `${newLeft}px`;
        this.elem.style.top = `${newTop}px`;
    }
}

const logger = (name: string, e: PointerEvent, elem: HTMLElement) => {
    console.log(`Event Name: ${name}\n PageX: ${e.pageX} PageY: ${e.pageY}\n Left: ${elem.style.left} Top: ${elem.style.top}`);
}





const windowDivC = new WindowDiv("50vw", "50vh");
windowDivC.addClass("window-div");

const newWindow = new WindowDiv("50vw", "50vh");
newWindow.addClass("window-div");



const draggableDivC = new DraggableDiv("50px", "50px", windowDivC);
draggableDivC.addClass("draggable-div");
draggableDivC.init();

const draggableDivCD = new DraggableDiv("100px", "50px", windowDivC);
draggableDivCD.addClass("draggable-div");
draggableDivCD.init();
const draggableDivCDD = new DraggableDiv("130px", "50px", newWindow);
draggableDivCDD.addClass("draggable-div");
draggableDivCDD.init();
const draggableDivCCD = new DraggableDiv("150px", "50px", newWindow);
draggableDivCCD.addClass("draggable-div");
draggableDivCCD.init();


windowDivC.appendChild(draggableDivC.elem);
windowDivC.appendChild(draggableDivCD.elem);

newWindow.appendChild(draggableDivCCD.elem);
newWindow.appendChild(draggableDivCDD.elem);

document.body.appendChild(windowDivC.elem);
document.body.appendChild(newWindow.elem)

window.onresize = () => {
    draggableDivC.adjustPosition();
    draggableDivCD.adjustPosition();
    draggableDivCCD.adjustPosition();
    draggableDivCDD.adjustPosition();
};
