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
    DivHandler.prototype.setStyle = function (color, text, display, bgColor) {
        this.elem.style.color = color;
        this.elem.innerText = text;
        this.elem.style.display = display;
        this.elem.style.backgroundColor = bgColor;
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
    function DraggableDiv(width, height, parent) {
        var _this = _super.call(this, width, height) || this;
        _this.offsetX = 0;
        _this.offsetY = 0;
        _this.handleDown = function (e) {
            _this.offsetX = e.clientX - _this.elem.offsetLeft;
            _this.offsetY = e.clientY - _this.elem.offsetTop;
            logger("DownHandler", e, _this.elem);
            _this.elem.setPointerCapture(e.pointerId);
            _this.elem.onpointermove = _this.handleMove;
        };
        _this.handleMove = function (e) {
            var newLeft = e.pageX - _this.offsetX;
            var newTop = e.pageY - _this.offsetY;
            var rect = _this.parent.getPosAndSize();
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
        _this.parent = parent;
        _this.elem.style.borderRadius = "50px";
        _this.elem.style.backgroundColor = "cyan";
        return _this;
    }
    DraggableDiv.prototype.init = function () {
        this.elem.onpointerdown = this.handleDown;
        this.elem.onpointerup = this.handleUp;
    };
    DraggableDiv.prototype.adjustPosition = function () {
        var rect = this.parent.getPosAndSize();
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
var logger = function (name, e, elem) {
    console.log("Event Name: ".concat(name, "\n PageX: ").concat(e.pageX, " PageY: ").concat(e.pageY, "\n Left: ").concat(elem.style.left, " Top: ").concat(elem.style.top));
};
var doDemo = function (draggable, parent) {
    var draggableElems = [];
    var parentElems = [];
    for (var i = 0; i < parent; ++i) {
        var newParent = new WindowDiv("auto", "auto");
        newParent.addClass("window-div");
        parentElems.push(newParent);
    }
    parentElems.map(function (p, idx) {
        for (var i = 0; i < draggable; ++i) {
            var newChild = new DraggableDiv("50px", "50px", p);
            newChild.addClass("draggable-div");
            p.appendChild(newChild.elem);
            draggableElems.push(newChild);
        }
        document.body.appendChild(p.elem);
    });
    draggableElems.map(function (d, idx) {
        d.init();
    });
    window.onresize = function () {
        draggableElems.map(function (d, idx) {
            d.adjustPosition();
        });
    };
};
doDemo(4, 5);
