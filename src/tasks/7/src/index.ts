
// let windowDiv = document.createElement('div');
// let draggableDiv = document.createElement('div');

// document.body.append(windowDiv);
// windowDiv.append(draggableDiv);

// windowDiv.classList.add('window-div');
// draggableDiv.classList.add('draggable-div');


// const logger = (name: string, e: PointerEvent, elem: HTMLElement) => {
//     console.log(`Event Name : ${name}\n PageX:${e.pageX} PageY:${e.pageY}\n Left: ${elem.style.left} Top : ${elem.style.top}\n${windowDiv}`)
// }

// const downHandler = (e: PointerEvent) => {

//     logger("DownHandler", e, draggableDiv);
//     draggableDiv.onpointermove = moveHandler;
// }

// const moveHandler = (e: PointerEvent) => {

//     logger("MoveHandler", e, draggableDiv);
    
//     draggableDiv.style.left = `${e.pageX}px`;
//     draggableDiv.style.top = `${e.pageY}px`;

// }

// const upHandler = (e: PointerEvent) => {
//     logger("upHandler", e, draggableDiv);

//     draggableDiv.releasePointerCapture(e.pointerId);
// }



// const init = () => {
//     draggableDiv.onpointerdown = downHandler;
//     draggableDiv.onpointerup = upHandler;
// }

// document.addEventListener('DOMContentLoaded', () => {
//     init();
// });


let windowDiv = document.createElement('div');
let draggableDiv = document.createElement('div');

document.body.append(windowDiv);
windowDiv.append(draggableDiv);

windowDiv.classList.add('window-div');
draggableDiv.classList.add('draggable-div');

let offsetX: number, offsetY: number;

const logger = (name: string, e: PointerEvent, elem: HTMLElement) => {
    console.log(`Event Name : ${name}\n PageX:${e.pageX} PageY:${e.pageY}\n Left: ${elem.style.left} Top : ${elem.style.top}\n${windowDiv}`);
}

const downHandler = (e: PointerEvent) => {
    offsetX = e.clientX - draggableDiv.offsetLeft;
    offsetY = e.clientY - draggableDiv.offsetTop;
    logger("DownHandler", e, draggableDiv);
    draggableDiv.setPointerCapture(e.pointerId);
    draggableDiv.onpointermove = moveHandler;
}

const moveHandler = (e: PointerEvent) => {
    logger("MoveHandler", e, draggableDiv);

    let newLeft = e.pageX - offsetX;
    let newTop = e.pageY - offsetY;

    const rect = windowDiv.getBoundingClientRect();
    const draggableRect = draggableDiv.getBoundingClientRect();

    if (newLeft < rect.left) newLeft = rect.left;
    if (newTop < rect.top) newTop = rect.top;
    if (newLeft + draggableRect.width > rect.right) newLeft = rect.right - draggableRect.width;
    if (newTop + draggableRect.height > rect.bottom) newTop = rect.bottom - draggableRect.height;

    draggableDiv.style.left = `${newLeft}px`;
    draggableDiv.style.top = `${newTop}px`;
}

const upHandler = (e: PointerEvent) => {
    logger("upHandler", e, draggableDiv);
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
