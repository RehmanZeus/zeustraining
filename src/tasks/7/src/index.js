var windowDiv = document.createElement('div');
var draggableDiv = document.createElement('div');
document.body.append(windowDiv);
windowDiv.append(draggableDiv);
windowDiv.classList.add('window-div');
draggableDiv.classList.add('draggable-div');
var offsetX, offsetY;
var downHandler = function (e) {
    offsetX = e.clientX - draggableDiv.offsetLeft;
    offsetY = e.clientY - draggableDiv.offsetTop;
    draggableDiv.setPointerCapture(e.pointerId);
    draggableDiv.onpointermove = moveHandler;
};
var moveHandler = function (e) {
    draggableDiv.style.left = "".concat(e.clientX - offsetX, "px");
    draggableDiv.style.top = "".concat(e.clientY - offsetY, "px");
};
var upHandler = function (e) {
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
