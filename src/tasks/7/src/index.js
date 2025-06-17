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
var windowDiv = document.createElement('div');
var draggableDiv = document.createElement('div');
document.body.append(windowDiv);
windowDiv.append(draggableDiv);
windowDiv.classList.add('window-div');
draggableDiv.classList.add('draggable-div');
var offsetX, offsetY;
var logger = function (name, e, elem) {
    console.log("Event Name : ".concat(name, "\n PageX:").concat(e.pageX, " PageY:").concat(e.pageY, "\n Left: ").concat(elem.style.left, " Top : ").concat(elem.style.top, "\n").concat(windowDiv));
};
var downHandler = function (e) {
    offsetX = e.clientX - draggableDiv.offsetLeft;
    offsetY = e.clientY - draggableDiv.offsetTop;
    logger("DownHandler", e, draggableDiv);
    draggableDiv.setPointerCapture(e.pointerId);
    draggableDiv.onpointermove = moveHandler;
};
var moveHandler = function (e) {
    logger("MoveHandler", e, draggableDiv);
    var newLeft = e.pageX - offsetX;
    var newTop = e.pageY - offsetY;
    var rect = windowDiv.getBoundingClientRect();
    var draggableRect = draggableDiv.getBoundingClientRect();
    if (newLeft < rect.left)
        newLeft = rect.left;
    if (newTop < rect.top)
        newTop = rect.top;
    if (newLeft + draggableRect.width > rect.right)
        newLeft = rect.right - draggableRect.width;
    if (newTop + draggableRect.height > rect.bottom)
        newTop = rect.bottom - draggableRect.height;
    draggableDiv.style.left = "".concat(newLeft, "px");
    draggableDiv.style.top = "".concat(newTop, "px");
};
var upHandler = function (e) {
    logger("upHandler", e, draggableDiv);
    draggableDiv.releasePointerCapture(e.pointerId);
    draggableDiv.onpointermove = null;
};
var init = function () {
    draggableDiv.onpointerdown = downHandler;
    draggableDiv.onpointerup = upHandler;
};
document.addEventListener('DOMContentLoaded', function () {
    init();
});
