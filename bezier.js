/* Class for storing data about a cubic Bezier curve */
class BezierCubicCurve {

    constructor() {
        this.points = [];

        this.selectedPoint = null; 
        this.selectedPointIdx = null;

        // Number of curve calculations per segment
        this.calcCount = 30;

        // Visual properties
        this.curveColor = '#6b42f4';
        this.curveLineWidth = 2;

    }

    addInterpolatedPoint(pos) {
        if (this.points.length == 0) {
            // Add first interpolated point
            this.points.push(pos);
            // Add first aproximated point
            this.points.push(pos);
        } else {
            // Add second aproximated point of current quad
            this.points.push(pos);
            // Add the interpolated point
            this.points.push(pos);
            // Add first aproximated point of next quad and select it
            this.points.push(pos);
        } 
        this.selectedPoint = this.points[this.points.length - 1];
        this.selectedPointIdx = this.points.length - 1;
    }

    moveSelectedPoint(newPos) {
        if (this.selectedPoint == null) {
            return;
        }

        // Check if selected point is approximated or interpolated
        var mod = this.selectedPointIdx % 3;
        if (this.selectedPointIdx == 1) {
            // If the selected point is the first aproximated one
            // then there is no related point to mirror
            this.points[this.selectedPointIdx] = newPos;
        } else if (mod == 0 || this.selectedPointIdx == 0) {
            // TODO: this is clunky, optimize
            var deltaX = newPos[0] - this.selectedPoint[0];
            var deltaY = newPos[1] - this.selectedPoint[1];
            console.log(deltaX);
            console.log(deltaY);
            this.points[this.selectedPointIdx + 1][0] += deltaX;
            this.points[this.selectedPointIdx + 1][1] += deltaY;
            if (this.selectedPointIdx != 0) {
                // If this isn't the first interpolated point we also need to change
                // the prevoius approx. point position                
                this.points[this.selectedPointIdx - 1][0] += deltaX;
                this.points[this.selectedPointIdx - 1][1] += deltaY;
            }
            this.selectedPoint[0] = newPos[0];
            this.selectedPoint[1] = newPos[1];
        } else {
            // If it's approximated, then check if its the first or second of the quad
            var relatedPointIdx = null;
            var middlePoint = null;
            if (mod == 1) {
                relatedPointIdx = this.selectedPointIdx - 2;
                middlePoint = this.selectedPointIdx - 1;
            } else {
                relatedPointIdx = this.selectedPointIdx + 2;
                middlePoint = this.selectedPointIdx + 1;
            }
            // Move the point and the related approximated point
            this.points[this.selectedPointIdx] = newPos;
            this.points[relatedPointIdx] = BezierCubicCurve.mirrorOverPoint(newPos, 
                                                this.points[middlePoint]);
        }
    }

    handleClick(cursorPos) {
        if (this.selectedPoint != null) {
            // If point is selected, set selected to null
            this.selectedPoint = null;
            this.selectedPointIdx = null;
        } else {
            // Check if user selected point or wanted to add one
            var nearbyPoint = this.findNearbyPoint(cursorPos);
            if (nearbyPoint != null) {
                this.selectedPoint = nearbyPoint[0];
                this.selectedPointIdx = nearbyPoint[1];
            } else {
                // If not call add new point
                this.addInterpolatedPoint(cursorPos);
            }
        }
    }

    findNearbyPoint(pos) {
        var nearbyPoint = null;
        for (var i = 0; i < this.points.length; i++) {
            var p = this.points[i];
            if (((p[0] - 6) <= pos[0] && pos[0] <= (p[0] + 6)) && 
                ((p[1] - 6) <= pos[1] && pos[1] <= (p[1] + 6))) {
                nearbyPoint = p;
                return [nearbyPoint, i];
            }
        }
        return null;
    }

    drawControls(canvas) {
        var ctx = canvas.getContext('2d');
        // Draw control lines and point dots
        if (this.points.length >= 2) {
            // Draw line of first approximated point, which doesn't have a related point
            var p1 = this.points[0];
            var p2 = this.points[1];
            var p3 = null;
           
            var ss = 4;
            var ss2 = ss * 2;
            var dotRadius = 3;

            ctx.strokeStyle = 'black';
            ctx.fillStyle = 'black';
            ctx.lineWidth = 1;

            ctx.fillRect(p1[0] - ss, p1[1] - ss, ss2, ss2);
            
            ctx.beginPath();
            ctx.arc(p2[0], p2[1], dotRadius, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.setLineDash([10, 10]);
            ctx.moveTo(p1[0], p1[1]);
            ctx.lineTo(p2[0], p2[1]);
            ctx.stroke();

            // Draw the rest of control lines
            for (var i = 3; i < this.points.length; i += 3) {
                p1 = this.points[i - 1];
                p2 = this.points[i];
                p3 = this.points[i + 1];

                ctx.fillRect(p2[0] - ss, p2[1] - ss, ss2, ss2);

                ctx.beginPath();
                ctx.moveTo(p1[0], p1[1]);
                ctx.arc(p1[0], p1[1], dotRadius, 0, 2 * Math.PI, false);
                ctx.moveTo(p3[0], p3[1]);
                ctx.arc(p3[0], p3[1], dotRadius, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.stroke();
                
                ctx.beginPath();
                ctx.setLineDash([10, 10]);
                ctx.moveTo(p1[0], p1[1]);
                ctx.lineTo(p3[0], p3[1]);
                ctx.stroke();
            }
        }
        
    }

    drawCurve(canvas) {
        var ctx = canvas.getContext('2d');
        // Draw the curve through points minus the % 4 ones
        var curvePoints = [];
        if (this.points.length >= 4) {
            var tail = this.points.length % 3;
            var placeholderArray = [];
            for (var i = 0; i <= this.points.length - tail; i++) {
                placeholderArray.push(this.points[i]);
                if (placeholderArray.length == 4) {
                    for (var j = 0; j <= this.calcCount; j++) {
                        curvePoints.push(BezierCubicCurve.deCasteljau(placeholderArray, 
                                                                    j / this.calcCount));      
                    }
                    placeholderArray = [];
                    i--;
                }
            }
        }
        if (curvePoints.length != 0) {
            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.strokeStyle = this.curveColor;
            ctx.lineWidth = this.curveLineWidth;
            for (var i = 0; i < curvePoints.length - 1; i++) {
                var p1 = curvePoints[i];
                var p2 = curvePoints[i + 1];
                ctx.moveTo(p1[0], p1[1]);
                ctx.lineTo(p2[0], p2[1]);
            }
            ctx.closePath();
            ctx.stroke();
        }
    }

    static deCasteljau(pts, t) {
        for (var a = pts; a.length > 1; a = b) {
            for (var i = 0, b = [], j; i < a.length - 1; i++) {
                for (b[i] = [], j = 0; j < a[i].length; j++) { 
                    b[i][j] = a[i][j] * (1 - t) + a[i+1][j] * t;
                }
            }
        }
        return a[0];
    }   

    static mirrorOverPoint(point, centerPoint) {
        var deltaX = centerPoint[0] - point[0];
        var deltaY = centerPoint[1] - point[1];
        var diffV = [deltaX * 2, deltaY * 2]; 
        return [point[0] + diffV[0], point[1] + diffV[1]];
    }

    // Getters and setters
    getCurveColor() {
        return this.curveColor;
    }

    setCurveColor (color) {
        this.curveColor = color;
    }

    getCurveLineWidth() {
        return this.curveLineWidth;
    }

    setCurveLineWidth (width) {
        this.curveLineWidth = width;
    }

    

}


function onCursorClick(event) {
    selectedCurve.handleClick(getCursorPosition(event));
}

function addCurve() {
    curves.push(new BezierCubicCurve());
    selectCurve(curves.length - 1);
    // Update curve selector
    updateCurveSelector(curves.length - 1);
    redrawCanvas();
}

function selectCurve(idx) {
    selectedCurve = curves[idx];
    updateCurveProperties();
}

function updateCurveSelector(selectedOptionIdx) {
    // Remove old options
    curveSelector.options.length = 0;
    // Add new options
    for (var i = 0; i < curves.length; i++) { 
        var option = document.createElement("option");
        option.text = 'Curve'.concat(i + 1);
        curveSelector.add(option);
    }
    curveSelector.selectedIndex = selectedOptionIdx;
}

function removeSelectedCurve() {
    // We create a new array instead of modifying the old one
    if (selectedCurve == null) {
        alert("No curve selected!");
        return;
    }
    var newArray = [];
    for (var i = 0; i < curves.length; i++) {
        var curve = curves[i];
        if (curve != selectedCurve) {
            newArray.push(curves[i]);
        }
    }
    curves = newArray;
    // Update curve selector, disselect all (-1)
    updateCurveSelector(-1);
    redrawCanvas();
}

function updateCurveProperties() { 
    curveColorTextArea.value = selectedCurve.getCurveColor();
    curveLineWidthTextArea.value = selectedCurve.getCurveLineWidth();
}

function onChangeSelector() {
    selectCurve(curveSelector.selectedIndex);
    redrawCanvas();
}

function applyColor() {
    selectedCurve.setCurveColor(curveColorTextArea.value); 
    redrawCanvas();
}

function applyLineWidth() {
    selectedCurve.setCurveLineWidth(parseInt(curveLineWidthTextArea.value));
    redrawCanvas();
}

function getCursorPosition(event) {
    var rect = canvas.getBoundingClientRect();
    var x = Math.round(event.clientX - rect.left);
    var y = Math.round(event.clientY - rect.top);
    return [x, y]; 
}

function redrawCanvas() {
    var ctx = canvas.getContext('2d');
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // For each curve
    curves.forEach(function(curve) {
        // Call draw function of curve
        curve.drawCurve(canvas);
        // If this curve is currently selected, then also draw control stuff (lines)
        if (curve == selectedCurve) {
            curve.drawControls(canvas);
        }
    });
}

function mainLoop(event) {
    if (selectedCurve == null) {
        return;
    }
    // Move selected point of selected curve to mouse pos
    selectedCurve.moveSelectedPoint(getCursorPosition(event));

    redrawCanvas();
}


var canvas = document.getElementById('canvas');
var maxX = canvas.width;
var maxY = canvas.height;

var curveSelector = document.getElementById('curveSelector');
var btnAddCurve = document.getElementById('btnAddCurve');
var btnRemoveSelectedCurve = document.getElementById('btnRemoveSelectedCurve');

var curveColorTextArea = document.getElementById('curveColorTextArea');
var curveLineWidthTextArea = document.getElementById('curveLineWidthTextArea');
var btnApplyColor = document.getElementById('btnApplyColor');
var btnApplyLineWidth = document.getElementById('btnApplyLineWidth');

var curves = [];
var selectedCurve = null;

// Add an empty curve in the beginning
addCurve();

canvas.addEventListener('click', function(event) { onCursorClick(event); }, false);
curveSelector.addEventListener('change', onChangeSelector, false);

btnAddCurve.addEventListener('click', addCurve, false);
btnRemoveSelectedCurve.addEventListener('click', removeSelectedCurve, false);

btnApplyColor.addEventListener('click', applyColor, false);
btnApplyLineWidth.addEventListener('click', applyLineWidth, false);

canvas.addEventListener('mousemove', function(event) { mainLoop(event); }); 
