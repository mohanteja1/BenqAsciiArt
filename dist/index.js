function isPointOutOfCanvas(canvasDim, point) {
    return point.x < 0 || point.x >= canvasDim.width || point.y < 0 || point.y >= canvasDim.height;
}
function fillCanvas(canvas, stroke) {
    canvas.plane.forEach((line) => {
        line.fill(stroke);
    });
}
function printCanvas(canvas) {
    canvas.plane.forEach((line) => {
        console.log(line.join(''));
    });
}
function square(a) {
    return a * a;
}
function calculateDistance(p1, p2) {
    return Math.sqrt(square(p2.x - p1.x) + square(p2.y - p1.y));
}
function sortOriginNearest(origin, points) {
    return points.sort((p1, p2) => {
        return calculateDistance(origin, p1) - calculateDistance(origin, p2);
    });
}
function sortAlongYaxis(points) {
    return points.sort((p1, p2) => {
        return p1.y - p2.y;
    });
}
function sortAlongXaxis(points) {
    return points.sort((p1, p2) => {
        return p1.x - p2.x;
    });
}
function removeDuplicates(points) {
    const valueMap = {};
    return points.filter((p) => {
        const key = p.x + ':' + p.y;
        if (valueMap[key])
            return false;
        else {
            valueMap[key] = true;
            return true;
        }
    });
}
;
function movePointToOrigin(origin, point) {
    return {
        x: point.x + origin.x,
        y: point.y + origin.y
    };
}
function plotPoints(canvas, points, stroke) {
    points.forEach((point) => {
        plotPoint(canvas, point, stroke);
    });
}
function plotPoint(canvas, point, stroke) {
    if (isPointOutOfCanvas(canvas.dimensions, point))
        return;
    canvas.plane[Math.round(point.x)][Math.round(point.y)] = stroke;
}
function lineSlope(p1, p2) {
    return (p2.y - p1.y) / (p2.x - p1.x);
}
function plotLine(canvas, p1, p2, stroke) {
    const m = lineSlope(p1, p2);
    const c = p1.y - (m * p1.x);
    let points = [];
    if (m !== 0 && m !== Infinity && m !== -Infinity && m !== -0) {
        const [start, end] = sortAlongYaxis([p1, p2]);
        const yFn = (x) => (m * x) + c; // y = mx + c;
        const xFn = (y) => m === Infinity ? start.x : (y - c) / m; // x = (y-c)/m;
        points.push(start);
        let currentX = start.x;
        while (currentX <= end.x) {
            points.push({
                x: currentX,
                y: yFn(currentX)
            });
            currentX++;
        }
        let currentY = start.y;
        while (currentY <= end.y) {
            points.push({
                x: xFn(currentY),
                y: currentY,
            });
            currentY++;
        }
        points.push(end);
    }
    if (m === 0 || m === -0) {
        // y = start.y === end.y
        const [start, end] = sortAlongXaxis([p1, p2]);
        points.push(start);
        let currentX = start.x;
        while (currentX <= end.x) {
            points.push({
                x: currentX,
                y: start.y
            });
            currentX++;
        }
        points.push(end);
    }
    if (m === Infinity || m === -Infinity) {
        // x = start.x === end.x
        const [start, end] = sortAlongYaxis([p1, p2]);
        points.push(start);
        let currentY = start.y;
        while (currentY <= end.y) {
            points.push({
                x: start.x,
                y: currentY
            });
            currentY++;
        }
        points.push(end);
    }
    points = removeDuplicates(points);
    plotPoints(canvas, points, stroke);
    return points;
}
function plotTriangle(canvas, A, B, C, stroke) {
    plotLine(canvas, A, B, stroke);
    plotLine(canvas, B, C, stroke);
    plotLine(canvas, C, A, stroke);
}
function plotText(canvas, start, orientation, text) {
    let points = [];
    const textLen = text.length;
    if (orientation === 'vertical') {
        let currentX = start.x;
        let loopTill = start.x + textLen;
        while (currentX <= loopTill) {
            points.push({
                ...start,
                x: currentX
            });
            currentX++;
        }
    }
    else {
        let currentY = start.y;
        let loopTill = start.y + textLen;
        while (currentY <= loopTill) {
            points.push({
                ...start,
                y: currentY
            });
            currentY++;
        }
    }
    points = sortOriginNearest(start, removeDuplicates(points));
    [...text].forEach((char, index) => {
        plotPoint(canvas, points[index], char);
    });
    return points;
}
function plotRectangle(canvas, A, dimensions, boundaryStroke, fillStroke) {
    const B = {
        ...A,
        x: A.x + dimensions.width
    };
    const C = {
        ...A,
        y: A.y + dimensions.height
    };
    const D = {
        ...B,
        y: A.y + dimensions.height
    };
    plotLine(canvas, A, B, boundaryStroke);
    plotLine(canvas, B, D, boundaryStroke);
    plotLine(canvas, C, D, boundaryStroke);
    plotLine(canvas, C, A, boundaryStroke);
    if (fillStroke) {
        floodFill(canvas, {
            x: A.x + 1,
            y: A.y + 1
        }, boundaryStroke, fillStroke);
    }
}
function plotCircle(canvas, A, radius, boundaryStroke, fillStorke) {
    // x^2 + y^2 = r^2;
    const otherDimension = (y) => Math.round(Math.sqrt((radius * radius) - (y * y)));
    let points = [];
    // along x axis
    let currentLen = 0;
    while (currentLen <= radius) {
        points.push({
            x: A.x + currentLen,
            y: A.y + otherDimension(currentLen)
        });
        points.push({
            x: A.x - currentLen,
            y: A.y + otherDimension(currentLen)
        });
        points.push({
            x: A.x + currentLen,
            y: A.y - otherDimension(currentLen)
        });
        points.push({
            x: A.x - currentLen,
            y: A.y - otherDimension(currentLen)
        });
        currentLen++;
    }
    points = removeDuplicates(points);
    plotPoints(canvas, points, boundaryStroke);
    if (fillStorke) {
        floodFill(canvas, A, boundaryStroke, fillStorke);
    }
    return points;
}
function strokeAtPoint(canvas, point) {
    return canvas.plane[point.x][point.y];
}
function floodFill(canvas, pointInside, boundaryStroke, fillStroke) {
    const points = [];
    const isOkToColor = (point) => {
        if (isPointOutOfCanvas(canvas.dimensions, point))
            return false;
        const stroke = strokeAtPoint(canvas, point);
        if (stroke === boundaryStroke || stroke === fillStroke) {
            return false;
        }
        return true;
    };
    points.push(pointInside);
    while (points.length !== 0) {
        const point = points.pop();
        const { x, y } = point;
        plotPoint(canvas, point, fillStroke);
        const right = { x: x + 1, y };
        const left = { x: x - 1, y };
        const top = { x, y: y + 1 };
        const bottom = { x, y: y - 1 };
        [right, left, top, bottom].forEach((p) => {
            if (isOkToColor(p))
                points.push(p);
        });
    }
}
const yAxisLen = process.stdout.columns;
const xAxisLen = process.stdout.rows;
const wholeGradientChars = ['@', '#', '$', '%', '{', '}', '(', ')', '/', '!', ':'];
const centredGradientChars = ['*', '+', '=', '-'];
const topGradientChars = ['^'];
const bottomGradientChars = [',', '.'];
const whiteBlock = '▓';
const grayBlock = '▒';
const whiteDot = '○';
function plotGuides(canvas) {
    canvas.plane.forEach((line, index) => {
        plotPoint(canvas, { x: index, y: 0 }, (index % 10).toString());
        if ((index) % 10 === 0) {
            plotPoint(canvas, { x: index, y: 0 }, whiteBlock);
            plotText(canvas, { x: index, y: 1 }, 'horizontal', index.toString());
        }
    });
    canvas.plane[0].forEach((c, index) => {
        plotPoint(canvas, { x: 0, y: index }, (index % 10).toString());
        if ((index) % 10 === 0) {
            plotPoint(canvas, { x: 0, y: index }, whiteBlock);
            plotText(canvas, { x: 1, y: index }, 'horizontal', index.toString());
        }
    });
}
function transposeCanvas(canvas) {
    const plane = canvas.plane;
    let rows = plane.length;
    let cols = plane[0].length;
    let result = [];
    for (let j = 0; j < cols; j++) {
        result[j] = [];
    }
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            result[j][i] = plane[i][j];
        }
    }
    canvas.plane = result;
}
function getPointInDirection(p1, distance, angleRad) {
    return { x: Math.round(p1.x + (distance * Math.cos(angleRad))), y: Math.round(p1.y + (distance * Math.sin(angleRad))) };
}
function plotEquilateralTriangle(canvas, point, radius, alpha, stroke) {
    const p1 = getPointInDirection(point, radius, Math.PI / 2 + alpha);
    const p2 = getPointInDirection(point, radius, Math.PI + (Math.PI / 4) + alpha);
    const p3 = getPointInDirection(point, radius, (2 * Math.PI) - (Math.PI / 4) + alpha);
    plotTriangle(canvas, p1, p2, p3, stroke);
}
function plotSketchDetails(canvas) {
    const sketchDimension = `dimensions: ${canvas.dimensions.width} x ${canvas.dimensions.height}`;
    const author = 'mohan teja';
    const title = 'tech vision: type-2 civilization with ai and quantum computers';
    plotText(canvas, { x: canvas.dimensions.width - 1, y: canvas.dimensions.height - sketchDimension.length }, 'horizontal', sketchDimension);
    plotText(canvas, { x: canvas.dimensions.width - 2, y: canvas.dimensions.height - author.length }, 'horizontal', author);
    plotText(canvas, { x: canvas.dimensions.width - 3, y: canvas.dimensions.height - title.length }, 'horizontal', title);
}
function typeTwoCivilization(artCanvas) {
    fillCanvas(artCanvas, ' ');
    // plotGuides(artCanvas);
    const lineSymetryX = Math.round(artCanvas.dimensions.width / 2);
    const lineSymetryY = Math.round(artCanvas.dimensions.height / 2);
    // sun
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 34, '>');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 33, ')');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 32, '.');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 31, '.');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 30, '.');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 29, '.');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 28, '.');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 27, '.');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 26, '.');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 25, '.');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 24, '.');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 23, '.');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 22, '.');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 21, '.');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 20, '.');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 19, '.');
    plotText(artCanvas, { x: lineSymetryX - 1, y: 6 }, 'vertical', 'SUN');
    // engergy absorbers
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 59, '|');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 60, ']');
    plotCircle(artCanvas, { x: lineSymetryX, y: -11 }, 61, ']');
    plotText(artCanvas, { x: lineSymetryX - 6, y: 40 }, 'vertical', 'energy absorbers');
    // heat insulators
    plotRectangle(artCanvas, { x: 5, y: Math.round(lineSymetryY / 2) }, { height: 5, width: lineSymetryX - 5 }, '.', whiteDot);
    plotRectangle(artCanvas, { x: lineSymetryX, y: Math.round(lineSymetryY / 2) }, { height: 5, width: lineSymetryX - 5 }, '.', whiteDot);
    plotText(artCanvas, { x: 7, y: Math.round(lineSymetryY / 2) + 6 }, 'horizontal', 'insulators');
    const plotEnergyModulatorDeck = (point, len) => {
        const { x, y } = point;
        let size = 0;
        while (size <= len) {
            plotCircle(artCanvas, { x: x + size, y }, 5, '+');
            size++;
        }
    };
    const plotEnergyModulator = (point) => {
        const { x, y } = point;
        let size = 0;
        let len = 4;
        while (size < len) {
            plotCircle(artCanvas, { x: x + size, y }, 5, '+');
            size++;
        }
    };
    plotEnergyModulator({ x: lineSymetryX - 11, y: Math.round(lineSymetryY / 2) + 10 });
    plotEnergyModulator({ x: lineSymetryX - 1, y: Math.round(lineSymetryY / 2) + 10 });
    plotEnergyModulator({ x: lineSymetryX + 9, y: Math.round(lineSymetryY / 2) + 10 });
    plotPoint(artCanvas, { x: lineSymetryX, y: Math.round(lineSymetryY / 2) + 10 }, whiteDot);
    plotEnergyModulatorDeck({ x: lineSymetryX - 12, y: Math.round(lineSymetryY / 2) + 20 }, 24);
    plotText(artCanvas, { x: 15, y: Math.round(lineSymetryY / 2) + 10 }, 'horizontal', 'modulator');
    // energy
    plotCircle(artCanvas, { x: lineSymetryX, y: lineSymetryY - 18 }, 6, '0');
    plotCircle(artCanvas, { x: lineSymetryX, y: lineSymetryY - 18 }, 5, '0');
    plotCircle(artCanvas, { x: lineSymetryX, y: lineSymetryY - 18 }, 4, '0');
    plotCircle(artCanvas, { x: lineSymetryX, y: lineSymetryY - 18 }, 3, '0');
    plotCircle(artCanvas, { x: lineSymetryX, y: lineSymetryY - 18 }, 2, '0');
    plotCircle(artCanvas, { x: lineSymetryX, y: lineSymetryY - 18 }, 1, '0');
    //energy compartment
    plotRectangle(artCanvas, { x: lineSymetryX - 10, y: lineSymetryY - 25 }, { height: 13, width: 11 }, "-");
    plotRectangle(artCanvas, { x: lineSymetryX - 10, y: lineSymetryY - 25 }, { height: 13, width: 10 }, "0", '.');
    plotRectangle(artCanvas, { x: lineSymetryX, y: lineSymetryY - 25 }, { height: 13, width: 10 }, "0", '.');
    plotText(artCanvas, { x: lineSymetryX - 11, y: lineSymetryY - 22 }, 'horizontal', 'storage');
    // energy tunnelling
    plotEquilateralTriangle(artCanvas, { x: lineSymetryX, y: lineSymetryY }, 4, 0, '.');
    plotEquilateralTriangle(artCanvas, { x: lineSymetryX, y: lineSymetryY }, 5, 0, '.');
    plotEquilateralTriangle(artCanvas, { x: lineSymetryX, y: lineSymetryY }, 6, 0, '.');
    plotEquilateralTriangle(artCanvas, { x: lineSymetryX, y: lineSymetryY }, 7, 0, '.');
    plotEquilateralTriangle(artCanvas, { x: lineSymetryX, y: lineSymetryY }, 8, 0, '.');
    plotEquilateralTriangle(artCanvas, { x: lineSymetryX, y: lineSymetryY }, 9, 0, '.');
    plotEquilateralTriangle(artCanvas, { x: lineSymetryX, y: lineSymetryY }, 10, 0, '.');
    plotEquilateralTriangle(artCanvas, { x: lineSymetryX, y: lineSymetryY }, 11, 0, '.');
    plotEquilateralTriangle(artCanvas, { x: lineSymetryX, y: lineSymetryY }, 12, 0, '.');
    plotEquilateralTriangle(artCanvas, { x: lineSymetryX, y: lineSymetryY }, 13, 0, '.');
    plotEquilateralTriangle(artCanvas, { x: lineSymetryX, y: lineSymetryY }, 14, 0, '.');
    plotEquilateralTriangle(artCanvas, { x: lineSymetryX, y: lineSymetryY }, 15, 0, '*');
    plotText(artCanvas, { x: lineSymetryX + 10, y: lineSymetryY }, 'horizontal', 'energy tunnelling');
    const plotEnergyTunnel = (start, startRadius, gap, radiusChange, length, direction) => {
        const { x, y } = start;
        let size = 0;
        while (size < length) {
            plotCircle(artCanvas, { x: x, y: y + (size * gap) }, startRadius + (radiusChange * size), '.');
            size++;
        }
    };
    plotEnergyTunnel({ x: lineSymetryX, y: (lineSymetryY) + 15 }, 2, 3, 1, 20, 'right');
    plotEnergyTunnel({ x: lineSymetryX, y: (lineSymetryY) + 15 + 20 * 3 }, 2 + 20, 7, 0, 10, 'right');
    // earth
    plotCircle(artCanvas, { x: lineSymetryX, y: (lineSymetryY * 2) + 5 }, 18, grayBlock);
    plotCircle(artCanvas, { x: lineSymetryX, y: (lineSymetryY * 2) + 5 }, 17, grayBlock);
    plotCircle(artCanvas, { x: lineSymetryX, y: (lineSymetryY * 2) + 5 }, 16, '+');
    plotCircle(artCanvas, { x: lineSymetryX, y: (lineSymetryY * 2) + 5 }, 15, '0');
    plotCircle(artCanvas, { x: lineSymetryX, y: (lineSymetryY * 2) + 5 }, 14, '+');
    plotCircle(artCanvas, { x: lineSymetryX, y: (lineSymetryY * 2) + 5 }, 13, '0');
    plotCircle(artCanvas, { x: lineSymetryX, y: (lineSymetryY * 2) + 5 }, 12, '+');
    plotCircle(artCanvas, { x: lineSymetryX, y: (lineSymetryY * 2) + 5 }, 12, grayBlock);
    plotCircle(artCanvas, { x: lineSymetryX, y: (lineSymetryY * 2) + 5 }, 12, grayBlock);
    plotCircle(artCanvas, { x: lineSymetryX, y: (lineSymetryY * 2) + 5 }, 12, grayBlock);
    plotText(artCanvas, { x: lineSymetryX, y: (lineSymetryY * 2) - 2 }, 'vertical', 'EARTH');
    plotSketchDetails(artCanvas);
    printCanvas(artCanvas);
}
function main() {
    // please set the terminal to 63 x 204 resolution
    const optimalDim = { width: 63, height: 204 };
    const artCanvas = {
        plane: Array.from(Array(optimalDim.width).fill(' '), () => new Array(optimalDim.height).fill(' ')),
        dimensions: {
            height: 204,
            width: 63
        },
        origin: {
            x: 0,
            y: 0,
        }
    };
    typeTwoCivilization(artCanvas);
}
main();
//# sourceMappingURL=index.js.map