define(function () {

    var PhotoEditor = function (options) {
        this.options = options;

        this.url = options["url"];

        this.mouseDown = false;
        this.lastX = null;
        this.lastY = null;
        this.context = null;

        this.img = null;

        this.pushHistory = [];
        this.step = -1;

        this.rgb = [-1, -1, -1];

        this.initComponent();
    };

    PhotoEditor.prototype.initComponent = function () {
        var self = this;
        var myCanvas = document.getElementById('myCanvas');
        self.context = myCanvas.getContext("2d");

        myCanvas.setAttribute("width", self.options["width"]);
        myCanvas.setAttribute("height", self.options["height"]);

        self.drawImage();
    };

    PhotoEditor.prototype.drawImage = function drawImage() {
        var self = this;
        self.img = new Image();
        self.img.src = this.url;
        $(self.img).load(function () {
            self.context.drawImage(self.img, 0, 0, self.options["width"], self.options["height"]);
            self.push();
        });
    };


    PhotoEditor.prototype.drawLine = function drawLine(x, y, isDown) {
        var self = this;
        if (isDown) {
            self.context.beginPath();
            self.context.strokeStyle = $('#pencilColor').val();
            self.context.lineWidth = $('#pencilWidth').val();
            self.context.lineJoin = "round";
            self.context.moveTo(self.lastX, self.lastY);
            self.context.lineTo(x, y);
            self.context.closePath();
            self.context.stroke();
        }
        self.lastX = x;
        self.lastY = y;
    };

    var Align = {
        Horizontal: 0,
        Vertical: 1
    };
    PhotoEditor.prototype.flipH = function flipH() {
        this.flip(Align.Horizontal);
    };

    PhotoEditor.prototype.flipV = function flipV() {
        this.flip(Align.Vertical);
    };
    PhotoEditor.prototype.flip = function flip(align) {
        var self = this;
        var dataURL = document.getElementById('myCanvas').toDataURL();

        self.img = new Image();
        self.img.onload = function () {
            var scaleH = (align == Align.Horizontal) ? -1 : 1, // Set horizontal scale to -1 if flip horizontal
                scaleV = (align == Align.Vertical) ? -1 : 1, // Set verical scale to -1 if flip vertical
                posX = (align == Align.Horizontal) ? this.width * -1 : 0, // Set x position to -100% if flip horizontal 
                posY = (align == Align.Vertical) ? this.height * -1 : 0; // Set y position to -100% if flip vertical

            self.context.save(); // Save the current state
            self.context.scale(scaleH, scaleV); // Set scale to flip the image
            self.context.drawImage(this, posX, posY, this.width, this.height); // draw the image
            self.context.restore(); // Restore the last saved state

            self.push();
        };
        self.img.src = dataURL;
    };

    PhotoEditor.prototype.invert = function invert() {
        this.modifyImageColor("invert");
    };
    PhotoEditor.prototype.grayscale = function grayscale() {
        this.modifyImageColor("grayscale");
    };
    PhotoEditor.prototype.applyRGB = function applyRGB() {
        var num = -1;
        this.rgb[0] = (!isNaN(num = parseInt(document.querySelector("#RGB input[name=R]").value))) ? num : -1;
        this.rgb[1] = (!isNaN(num = parseInt(document.querySelector("#RGB input[name=G]").value))) ? num : -1;
        this.rgb[2] = (!isNaN(num = parseInt(document.querySelector("#RGB input[name=B]").value))) ? num : -1;

        this.modifyImageColor("RGB");
    };
    PhotoEditor.Colorization = {
        invert: function (imgData) {
            var data = imgData.data;
            for (var i = 0; i < data.length; i += 4) {
                // red
                data[i] = 255 - data[i];
                // green
                data[i + 1] = 255 - data[i + 1];
                // blue
                data[i + 2] = 255 - data[i + 2];
            }
        },
        grayscale: function (imgData) {
            var data = imgData.data;
            for (var i = 0; i < data.length; i += 4) {
                var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
                // red
                data[i] = brightness;
                // green
                data[i + 1] = brightness;
                // blue
                data[i + 2] = brightness;
            }
        },
        RGB: function (imgData) {
            var data = imgData.data;
            for (var i = 0; i < data.length; i += 4) {
                // red
                if (this.rgb[0] != -1) data[i] = this.rgb[0];
                // green
                if (this.rgb[1] != -1) data[i + 1] = this.rgb[1];
                // blue
                if (this.rgb[2] != -1) data[i + 2] = this.rgb[2];
            }
            this.rgb = [-1, -1, -1];
        }
    };

    PhotoEditor.prototype.modifyImageColor = function modifyImageColor(action) {
        var self = this;
        self.img = new Image();
        self.img.onload = function () {

            self.context.drawImage(this, 0, 0);
            var imgData = self.context.getImageData(0, 0, this.width, this.height);

            PhotoEditor.Colorization[action].call(self, imgData);

            self.context.putImageData(imgData, 0, 0);

            self.push();
        };
        self.img.src = document.getElementById('myCanvas').toDataURL();
    };

    PhotoEditor.prototype.push = function push() {
        var self = this;
        self.step++;
        if (self.step < self.pushHistory.length) { self.pushHistory.length = self.step; }
        self.pushHistory.push(document.getElementById('myCanvas').toDataURL());
    };

    PhotoEditor.prototype.undo = function undo() {
        var self = this;
        if (self.step > 0) {
            self.step--;
            self.img = new Image();
            self.img.src = self.pushHistory[self.step];
            self.img.onload = function () {
                self.context.drawImage(self.img, 0, 0);
            };
        }
    };

    PhotoEditor.prototype.redo = function redo() {
        var self = this;
        if (self.step < self.pushHistory.length - 1) {
            self.step++;
            self.img = new Image();
            self.img.src = self.pushHistory[self.step];
            self.img.onload = function () {
                self.context.drawImage(self.img, 0, 0);
            };
        }
    };

    var instances = {},
        currentInstance = null;

    PhotoEditor.isDOMEventsAdded = false;

    PhotoEditor.addDOMEvents = function addDOMEvents() {
        if (!currentInstance) {
            return;
        }

        PhotoEditor.isDOMEventsAdded = true;

        var myCanvas = $('#myCanvas'),
            drawButton = $("#drawButton"),
            undoButton = $("#undoButton"),
            redoButton = $("#redoButton"),
            flipHButton = $("#flipHButton"),
            flipVButton = $("#flipVButton"),
            invertButton = $("#invertButton"),
            grayscaleButton = $("#grayscaleButton"),
            r = $("#RGB input[name=R]"),
            g = $("#RGB input[name=G]"),
            b = $("#RGB input[name=B]");


        myCanvas.mousedown(function (e) {
            currentInstance.mouseDown = true;
            currentInstance.drawLine(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, false);
        });

        myCanvas.mousemove(function (e) {
            if (currentInstance.mouseDown) {
                currentInstance.drawLine(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, true);
            }
        });

        myCanvas.mouseup(function (e) {
            if (currentInstance.mouseDown) {
                currentInstance.mouseDown = false;
                currentInstance.push();
            }
        });

        myCanvas.mouseleave(function (e) {
            if (currentInstance.mouseDown) {
                currentInstance.mouseDown = false;
                currentInstance.push();
            }
        });

        drawButton.click(function () {
            currentInstance.drawImage();
        });

        undoButton.click(function () {
            currentInstance.undo();
        });

        redoButton.click(function () {
            currentInstance.redo();
        });

        flipHButton.click(function () {
            currentInstance.flipH();
        });

        flipVButton.click(function () {
            currentInstance.flipV();
        });

        invertButton.click(function () {
            currentInstance.invert();
        });

        grayscaleButton.click(function () {
            currentInstance.grayscale();
        });
        var rgbChange = function () {
            currentInstance.applyRGB();
        };
        r.change(rgbChange);
        g.change(rgbChange);
        b.change(rgbChange);
    };



    return function (options) {
        var url = options["url"];

        if (!url) {
            return null;
        }
        if (instances[url] instanceof PhotoEditor) {
            instances[url].initComponent();
            return instances[url];
        }
        else {
            instances[url] = new PhotoEditor(options);
        }
        currentInstance = instances[url];

        if (!PhotoEditor.isDOMEventsAdded) {
            PhotoEditor.addDOMEvents();
        }

        return currentInstance;
    }

});