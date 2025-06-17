
let windowDiv = document.createElement('div');
let draggableDiv = document.createElement('div');

document.body.append(windowDiv);
windowDiv.append(draggableDiv);

windowDiv.classList.add('window-div');
draggableDiv.classList.add('draggable-div');

let offsetX: number, offsetY: number;

const downHandler = (e: PointerEvent) => {
    offsetX = e.clientX - draggableDiv.offsetLeft;
    offsetY = e.clientY - draggableDiv.offsetTop;
    draggableDiv.setPointerCapture(e.pointerId);
    draggableDiv.onpointermove = moveHandler;
}

const moveHandler = (e: PointerEvent) => {
    draggableDiv.style.left = `${e.clientX - offsetX}px`;
    draggableDiv.style.top = `${e.clientY - offsetY}px`;
}

const upHandler = (e: PointerEvent) => {
    draggableDiv.releasePointerCapture(e.pointerId);
    draggableDiv.onpointermove = null;
}

const init = () => {
    draggableDiv.onpointerdown = downHandler;
    draggableDiv.onpointerup = upHandler;
}

document.addEventListener('DOMContentLoaded', () => {
    init();
});
