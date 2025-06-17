var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var DivHandler = /** @class */ (function () {
    function DivHandler(width, height) {
        this.elem = document.createElement("div");
        this.elem.style.width = width;
        this.elem.style.height = height;
    }
    DivHandler.prototype.addClass = function (name) {
        this.elem.classList.add(name);
    };
    DivHandler.prototype.getPosAndSize = function () {
        return this.elem.getBoundingClientRect();
    };
    DivHandler.prototype.appendChild = function (elem) {
        this.elem.appendChild(elem);
    };
    return DivHandler;
}());
var WindowDiv = /** @class */ (function (_super) {
    __extends(WindowDiv, _super);
    function WindowDiv(width, height) {
        return _super.call(this, width, height) || this;
    }
    return WindowDiv;
}(DivHandler));
var DraggableDiv = /** @class */ (function (_super) {
    __extends(DraggableDiv, _super);
    function DraggableDiv(width, height, parentDiv) {
        var _this = _super.call(this, width, height) || this;
        _this.offsetX = 0;
        _this.offsetY = 0;
        _this.handleDown = function (e) {
            _this.offsetX = e.clientX - _this.elem.offsetLeft;
            _this.offsetY = e.clientY - _this.elem.offsetTop;
            _this.elem.setPointerCapture(e.pointerId);
            _this.elem.onpointermove = _this.handleMove;
        };
        _this.handleMove = function (e) {
            var newLeft = e.pageX - _this.offsetX;
            var newTop = e.pageY - _this.offsetY;
            var rect = _this.parentDiv.getPosAndSize();
            var draggableRect = _this.getPosAndSize();
            if (newLeft < rect.left)
                newLeft = rect.left;
            if (newTop < rect.top)
                newTop = rect.top;
            if (newLeft + draggableRect.width > rect.right)
                newLeft = rect.right - draggableRect.width;
            if (newTop + draggableRect.height > rect.bottom)
                newTop = rect.bottom - draggableRect.height;
            _this.elem.style.left = "".concat(newLeft, "px");
            _this.elem.style.top = "".concat(newTop, "px");
        };
        _this.handleUp = function (e) {
            _this.elem.releasePointerCapture(e.pointerId);
            _this.elem.onpointermove = null;
        };
        _this.parentDiv = parentDiv;
        return _this;
    }
    DraggableDiv.prototype.init = function () {
        this.elem.onpointerdown = this.handleDown;
        this.elem.onpointerup = this.handleUp;
    };
    DraggableDiv.prototype.adjustPosition = function () {
        var rect = this.parentDiv.getPosAndSize();
        var draggableRect = this.getPosAndSize();
        var newLeft = this.elem.offsetLeft;
        var newTop = this.elem.offsetTop;
        if (newLeft < rect.left)
            newLeft = rect.left;
        if (newTop < rect.top)
            newTop = rect.top;
        if (newLeft + draggableRect.width > rect.right)
            newLeft = rect.right - draggableRect.width;
        if (newTop + draggableRect.height > rect.bottom)
            newTop = rect.bottom - draggableRect.height;
        this.elem.style.left = "".concat(newLeft, "px");
        this.elem.style.top = "".concat(newTop, "px");
    };
    return DraggableDiv;
}(DivHandler));
var createParentChildDivs = function (numParents, numChildren) {
    var parentDivs = [];
    var childDivs = [];
    for (var i = 0; i < numParents; i++) {
        var parentDivC = new WindowDiv("50%", "50vh");
        parentDivC.addClass("window-div");
        for (var j = 0; j < numChildren; j++) {
            var width = "".concat(Math.random() * 100 + 50, "px");
            var height = "".concat(Math.random() * 100 + 50, "px");
            var childDivC = new DraggableDiv(width, height, parentDivC);
            childDivC.addClass("draggable-div");
            childDivC.init();
            parentDivC.appendChild(childDivC.elem);
            childDivs.push(childDivC);
        }
        document.body.appendChild(parentDivC.elem);
        parentDivs.push(parentDivC);
    }
    window.onresize = function () {
        for (var _i = 0, childDivs_1 = childDivs; _i < childDivs_1.length; _i++) {
            var child = childDivs_1[_i];
            child.adjustPosition();
        }
    };
};
var style = document.createElement('style');
style.innerHTML = "\n    .window-div {\n        display: grid;\n        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));\n        gap: 10px;\n        border: 1px solid #000;\n        position: relative;\n    }\n    .draggable-div {\n        position: absolute;\n        background-color: lightblue;\n        border: 1px solid #000;\n        cursor: pointer;\n    }\n";
document.head.appendChild(style);
createParentChildDivs(3, 4);
