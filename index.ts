type Dimensions = {
    height: number;
    width: number;
};
type Point = {
    x: number;
    y: number;
};
type Canvas = {
    plane: string[][];
    dimensions: Dimensions;
    origin: Point;
}
type Stroke = string;


function isPointOutOfCanvas(canvasDim: Dimensions, point: Point): boolean {
    return point.x < 0 || point.x >= canvasDim.width || point.y < 0 || point.y >= canvasDim.height;
}

function fillCanvas(canvas: Canvas, stroke: string) {
    canvas.plane.forEach((line) => {
        line.fill(stroke);
    })
}

function printCanvas(canvas: Canvas) {
    canvas.plane.forEach((line) => {
        console.log(line.join(''));
    })
}

function square(a: number): number {
    return a * a;
}

function calculateDistance(p1: Point, p2: Point): number {
    return Math.sqrt(square(p2.x - p1.x) + square(p2.y - p1.y));
}

function sortOriginNearest(origin: Point, points: Point[]): Point[] {
    return points.sort((p1, p2) => {
        return calculateDistance(origin, p1) - calculateDistance(origin, p2);
    });
}

function sortAlongYaxis(points: Point[]): Point[] {
    return points.sort((p1, p2) => {
        return p1.y - p2.y;
    });
}

function sortAlongXaxis(points: Point[]): Point[] {
    return points.sort((p1, p2) => {
        return p1.x - p2.x;
    });
}

function removeDuplicates(points: Point[]): Point[] {
    const valueMap = {};
    return points.filter((p) => {
        const key = p.x + ':' + p.y;
        if (valueMap[key]) return false;
        else {
            valueMap[key] = true;
            return true;
        }
    });
};

function movePointToOrigin(origin: Point, point: Point): Point {
    return {
        x: point.x + origin.x,
        y: point.y + origin.y
    };
}

function plotPoints(canvas: Canvas, points: Point[], stroke: string) {
    points.forEach((point) => {
        plotPoint(canvas, point, stroke)
    });
}

function plotPoint(canvas: Canvas, point: Point, stroke: string) {
    if (isPointOutOfCanvas(canvas.dimensions, point)) return;
    canvas.plane[Math.round(point.x)][Math.round(point.y)] = stroke;
}

function lineSlope(p1: Point, p2: Point): number {
    return (p2.y - p1.y) / (p2.x - p1.x);
}

function plotLine(canvas: Canvas, p1: Point, p2: Point, stroke: Stroke) {
    const m = lineSlope(p1, p2);
    const c = p1.y - (m * p1.x);
    let points: Point[] = [];
    if (m !== 0 && m !== Infinity && m !== -Infinity && m !== -0) {
        const [start, end] = sortAlongYaxis([p1, p2]);
        const yFn = (x: number): number => (m * x) + c; // y = mx + c;
        const xFn = (y: number): number => m === Infinity ? start.x : (y - c) / m; // x = (y-c)/m;
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

function plotTriangle(canvas: Canvas, A: Point, B: Point, C: Point, stroke: Stroke) {
    plotLine(canvas, A, B, stroke);
    plotLine(canvas, B, C, stroke);
    plotLine(canvas, C, A, stroke);
}

function plotText(canvas: Canvas, start: Point, orientation: 'vertical' | 'horizontal', text: string, ) {
    let points: Point[] = [];
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
    } else {
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

function plotRectangle(canvas: Canvas, A: Point, dimensions: Dimensions, boundaryStroke: Stroke, fillStroke ? : Stroke) {
    const B: Point = {
        ...A,
        x: A.x + dimensions.width
    };
    const C: Point = {
        ...A,
        y: A.y + dimensions.height
    };
    const D: Point = {
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

function plotCircle(canvas: Canvas, A: Point, radius: number, boundaryStroke: Stroke, fillStorke ? : Stroke) {
    // x^2 + y^2 = r^2;
    const otherDimension = (y: number): number => Math.round(Math.sqrt((radius * radius) - (y * y)));
    let points: Point[] = [];
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
    console.log(points);
    plotPoints(canvas, points, boundaryStroke);
    if (fillStorke) {
        floodFill(canvas, A, boundaryStroke, fillStorke);
    }
    return points;
}

function strokeAtPoint(canvas: Canvas, point: Point) {
    return canvas.plane[point.x][point.y];
}

function floodFill(canvas: Canvas, pointInside: Point, boundaryStroke: Stroke, fillStroke: Stroke) {
    const points: Point[] = [];
    const isOkToColor = (point: Point): boolean => {
        if (isPointOutOfCanvas(canvas.dimensions, point)) return false;
        const stroke = strokeAtPoint(canvas, point);
        if (stroke === boundaryStroke || stroke === fillStroke) {
            return false;
        }
        return true;
    }
    points.push(pointInside);
    while (points.length !== 0) {
        const point = points.pop()!;
        const { x, y} = point;
        plotPoint(canvas, point, fillStroke);
        const right: Point = { x: x + 1, y };
        const left: Point = { x: x - 1, y };
        const top: Point = { x, y: y + 1 };
        const bottom: Point = { x, y: y - 1 };
        [right, left, top, bottom].forEach((p) => {
            if (isOkToColor(p)) points.push(p);
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

const optimalPlotDimensions: Dimensions = { width: 204, height: 63 };

const artCanvas: Canvas = {
    plane: Array.from(Array(xAxisLen).fill(''), () => new Array(yAxisLen).fill('')),
    dimensions: {
        height: yAxisLen,
        width: xAxisLen
    },
    origin: {
        x: 0,
        y: 0,
    }
};

function plotGuides(canvas: Canvas) {
    canvas.plane.forEach((line, index) => {
        plotPoint(canvas, { x:index, y: 0 }, (index % 10).toString());
        if ((index) % 10 === 0) {
            plotPoint(canvas, { x:index, y: 0 }, whiteBlock);
            plotText(canvas, { x:index, y: 1 }, 'horizontal', index.toString());
        }
    });
    canvas.plane[0].forEach((c, index) => {
        plotPoint(canvas, { x: 0 , y: index }, (index % 10).toString());
        if ((index) % 10 === 0) {
            plotPoint(canvas, { x: 0 , y: index }, whiteBlock);
            plotText(canvas, { x: 1 , y: index }, 'horizontal', index.toString());
        }
    })
}

function transposeCanvas(canvas: Canvas) {
    const plane = canvas.plane;
    let rows = plane.length;
    let cols = plane[0].length;
  
    let result:string[][] = [];
    for(let j = 0; j < cols; j++) {
      result[j] = [];
    }
  
    for(let i = 0; i < rows; i++) {
      for(let j = 0; j < cols; j++) {
        result[j][i] = plane[i][j];
      }
    }
    canvas.plane = result;
}

function getPointInDirection(p1: Point, distance: number, angleRad: number): Point {
    return { x: Math.round(p1.x + (distance * Math.cos(angleRad))), y: Math.round(p1.y + (distance * Math.sin(angleRad))) };
}

function plotEquilateralTriangle(canvas: Canvas, point: Point, radius: number, alpha: number, stroke: Stroke) {
    const p1: Point = getPointInDirection(point, radius, Math.PI/2 + alpha);
    const p2: Point = getPointInDirection(point, radius, Math.PI + (Math.PI/4) + alpha);
    const p3: Point = getPointInDirection(point, radius, (2 * Math.PI) - (Math.PI/4) + alpha);
    plotTriangle(canvas, p1, p2, p3, stroke);
}

function randomStuff() {
    fillCanvas(artCanvas, ' ');
    plotGuides(artCanvas);
    plotCircle(artCanvas, { x: 20, y: 70 }, 4, '+');
    plotCircle(artCanvas, { x: 20, y: 70 }, 8, '+');
    plotCircle(artCanvas, { x: 20, y: 70 }, 12, '+');
    plotCircle(artCanvas, { x: 20, y: 70 }, 16, '+');

    plotTriangle(artCanvas, { x: 10, y: 20 }, { x: 10, y: 30 }, { x: 15, y: 25 }, '.' )
    plotTriangle(artCanvas, { x: 15, y: 25 }, { x: 15, y: 35 }, { x: 20, y: 30 }, '.' )
    plotTriangle(artCanvas, { x: 20, y: 30 }, { x: 20, y: 40 }, { x: 25, y: 35 }, '.' )
    plotLine(artCanvas, { x: 20, y: 30 }, { x: 10, y: 30 }, '.' )
    plotLine(artCanvas, { x: 10, y: 60 }, { x: 10, y: 40 }, '.' )
    plotLine(artCanvas, { x: 10, y: 60 }, { x: 10, y: 40 }, '.' )
    plotRectangle(artCanvas, { x: 16, y: 96 }, { height: 40, width: 20 }, '.', whiteDot);
    plotRectangle(artCanvas, { x: 14, y: 94 }, { height: 40, width: 20 }, '.', whiteDot);
    plotRectangle(artCanvas, { x: 12, y: 92 }, { height: 40, width: 20 }, '.', whiteDot);
    plotRectangle(artCanvas, { x: 10, y: 90 }, { height: 40, width: 20 }, '.', whiteDot );
   
    // plotText(artCanvas, { x: 50, y: 50 }, 'vertical', 'mohan teja');
    // plotText(artCanvas, { x: 50, y: 50 }, 'horizontal', 'mohan teja');
    printCanvas(artCanvas);
}

function plotSketchDetails(canvas: Canvas) {
    const sketchDimension = `dimensions: ${canvas.dimensions.width} x ${canvas.dimensions.height}`;
    const author = 'mohan teja';
    const title = 'type-2 civilization vision';
    plotText(canvas, { x: canvas.dimensions.width - 1, y: canvas.dimensions.height - sketchDimension.length }, 'horizontal', sketchDimension);
    plotText(canvas, { x: canvas.dimensions.width - 2, y: canvas.dimensions.height - author.length }, 'horizontal', author);
    plotText(canvas, { x: canvas.dimensions.width - 3, y: canvas.dimensions.height - title.length }, 'horizontal', title);
}

function typeTwoCivilization() {
    fillCanvas(artCanvas, ' ');
    plotGuides(artCanvas);

    // sun
    plotCircle(artCanvas, { x:30, y: -11}, 34, '>');
    plotCircle(artCanvas, { x:30, y: -11}, 33, ')');
    plotCircle(artCanvas, { x:30, y: -11}, 32, '.');
    plotCircle(artCanvas, { x:30, y: -11}, 31, '.');
    plotCircle(artCanvas, { x:30, y: -11}, 30, '.');
    plotCircle(artCanvas, { x:30, y: -11}, 29, '.');
    plotCircle(artCanvas, { x:30, y: -11}, 28, '.');
    plotCircle(artCanvas, { x:30, y: -11}, 27, '.');
    plotCircle(artCanvas, { x:30, y: -11}, 26, '.');
    plotCircle(artCanvas, { x:30, y: -11}, 25, '.');
    plotCircle(artCanvas, { x:30, y: -11}, 24, '.');
    plotCircle(artCanvas, { x:30, y: -11}, 23, '.');
    plotCircle(artCanvas, { x:30, y: -11}, 22, '.');
    plotCircle(artCanvas, { x:30, y: -11}, 21, '.');
    plotCircle(artCanvas, { x:30, y: -11}, 20, '.');
    plotCircle(artCanvas, { x:30, y: -11}, 19, '.');

    plotText(artCanvas, { x:29, y: 6}, 'vertical', 'SUN');


    const plotSpaceShip = (point: Point, len: number) => {
        const { x, y } = point;
        let size = 0;
        while(size <= len) {
            plotCircle(artCanvas, { x: x + size, y}, 5, '+');
            size++;
        }
    }

    plotCircle(artCanvas, { x: 20, y: 90}, 5, '+');
    plotCircle(artCanvas, { x: 21, y: 90}, 5, '+');
    plotCircle(artCanvas, { x: 22, y: 90}, 5, '+');
    plotCircle(artCanvas, { x: 23, y: 90}, 5, '+');

    plotCircle(artCanvas, { x: 30, y: 90}, 5, '+');
    plotCircle(artCanvas, { x: 31, y: 90}, 5, '+');
    plotCircle(artCanvas, { x: 32, y: 90}, 5, '+');
    plotCircle(artCanvas, { x: 33, y: 90}, 5, '+');
    
    plotCircle(artCanvas, { x: 40, y: 90}, 5, '+');
    plotCircle(artCanvas, { x: 41, y: 90}, 5, '+');
    plotCircle(artCanvas, { x: 42, y: 90}, 5, '+');
    plotCircle(artCanvas, { x: 43, y: 90}, 5, '+');

    plotSpaceShip({ x: 20, y: 100}, 23);

    plotRectangle(artCanvas, { x: 30, y: 78 }, { height: 5, width: 100 }, '.', whiteDot);
    plotRectangle(artCanvas, { x: 2, y: 78 }, { height: 5, width: 100 }, '.', whiteDot);

    plotTriangle(artCanvas, { x: 10, y: 20 }, { x: 10, y: 30 }, { x: 15, y: 25 }, '.' )

    plotEquilateralTriangle(artCanvas, { x: 30, y: 60 }, 4, Math.PI, '.');
    // plotEquilateralTriangle(artCanvas, { x: 30, y: 60 }, 5, '.');
    // plotEquilateralTriangle(artCanvas, { x: 30, y: 60 }, 6, '.');
    // plotEquilateralTriangle(artCanvas, { x: 30, y: 60 }, 7, '.');

    plotSketchDetails(artCanvas);
    // floodFill(artCanvas, {x: 30, y: 2 }, whiteDot, whiteBlock);
    printCanvas(artCanvas);
}

function particleCollider() {

}

function quantumComputer() {

}


function main() {
    // randomStuff();
    typeTwoCivilization();
    
}

main();