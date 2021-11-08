let drawTimeOut = null;
let paintTimeOut = null;
let nextDrawingStep = () => {};
let nextPaintingStep = () => {};
let delay = 30;

const border = 70;
const defaultStep = 1; // position increment
const velocityJump = 20;

function drawNextEventual(context, posX, posY, velX, velY, targetVelX, targetVelY) {
  if (Math.abs(velX) >= Math.abs(targetVelX)) {
    targetVelX = Math.random() * velocityJump * (Math.random() > 0.5 ? 1 : -1);
  }
  if (Math.abs(velY) >= Math.abs(targetVelY)) {
    targetVelY = Math.random() * velocityJump * (Math.random() > 0.5 ? 1 : -1);
  }

  const borderStepReduce = 0.1;
  let stepX = defaultStep;// + Math.random() * 3;
  let stepY = defaultStep;// + Math.random() * 3;
  // Push target back from the rim if position reaches border area
  if (posX < border) {
    targetVelX = Math.abs(targetVelX);
    stepX += (border - posX) * borderStepReduce;
  }
  if (posX > context.canvas.width - border) {
    targetVelX = 0 - Math.abs(targetVelX);
    stepX += (posX - (context.canvas.width - border)) * borderStepReduce;
  }
  if (posY < border) {
    targetVelY = Math.abs(targetVelY);
    stepY += (border - posY) * borderStepReduce;
  }
  if (posY > context.canvas.height - border) {
    targetVelY = 0 - Math.abs(targetVelY);
    stepY += (posY - (context.canvas.height - border)) * borderStepReduce;
  }

  velX = velX < targetVelX ? velX + stepX : velX - stepX;
  velY = velY < targetVelY ? velY + stepY : velY - stepY;

  const nextX = Math.floor(posX + velX);
  const nextY = Math.floor(posY + velY);

  if (nextX !== posX || nextY !== posY) {
    const [pixelR, pixelG, pixelB, pixelA] = context.getImageData(nextX, nextY, 1, 1).data;
    if (pixelR + pixelB + pixelG === 0 && pixelA === 255) {
      // The idea here is to detect when the line intersects another line and do the painting then.
      // However, it requires quite a bit of extra work: lines are larger then pixel so intersection is hard to detect,
      // there could be multi-line intersection, direction where line came from needs some logic to understand
      // where to start painting and so on. For now, painting is just random guessing.
      // console.log('XING');
      // spreadPaint(context, 1);
    }
  }

  context.beginPath();
  context.moveTo(posX, posY);

  context.lineTo(nextX, nextY);

  context.stroke();

  nextDrawingStep = () => drawNextEventual(context, nextX, nextY, velX, velY, targetVelX, targetVelY);
  drawTimeOut = setTimeout(nextDrawingStep, delay);
}

// Deprecated, but still around for the reference - draws straight lines instead of smooth
function drawNext(context, posX, posY, velX, velY) {
  const nextX = Math.floor(posX + 100 * velX);
  const nextY = Math.floor(posY + 100 * velY);

  context.beginPath();
  context.moveTo(posX, posY);

  context.lineTo(nextX, nextY);

  context.stroke();

  if (Math.random() < 0.1) {
      velX = Math.random() / 10 * (Math.random() > 0.5 ? 1 : -1);
  }

  if (Math.random() < 0.1) {
    velY = Math.random() / 10 * (Math.random() > 0.5 ? 1 : -1);
  }

  let nextVelX = velX;
  let nextVelY = velY;

  if (nextX < border) nextVelX = Math.abs(velX);
  if (nextX > context.canvas.width - border) nextVelX = 0 - Math.abs(velX);
  if (nextY < border) nextVelY = Math.abs(velY);
  if (nextY > context.canvas.height - border) nextVelY = 0 - Math.abs(velY);

  drawTimeOut = setTimeout(() => drawNext(context, nextX, nextY, nextVelX, nextVelY), delay);
}

function drawing(context) {
  context.fillStyle = "#FF0000";
  context.lineWidth = 3;
  context.strokeStyle = "#000000";

  const startX = Math.floor(Math.random() * context.canvas.width);
  const startY = Math.floor(Math.random() * context.canvas.height);

  // drawNext(context, startX, startY, 0.01, -0.01)
  nextDrawingStep = () => drawNextEventual(context, startX, startY, 1, 1, 1, 1);
  nextPaintingStep = () => spreadPaint(context, 1);
  toggleDraw();
}

function toggleDraw() {
  const toggleButton = document.getElementById('draw-toggle');

  if (drawTimeOut !== null) {
    clearTimeout(drawTimeOut);
    drawTimeOut = null;
    toggleButton.innerText = "Start drawing";
  } else {
    drawTimeOut = setTimeout(nextDrawingStep, delay);
    toggleButton.innerText = "Stop drawing";
  }
}

function togglePaint() {
  const toggleButton = document.getElementById('paint-toggle');

  if (paintTimeOut !== null) {
    clearTimeout(paintTimeOut);
    paintTimeOut = null;
    toggleButton.innerText = "Start painting";
  } else {
    paintTimeOut = setTimeout(nextPaintingStep, delay);
    toggleButton.innerText = "Stop painting";
  }
}

function changeDelay(event) {
  const selector = document.getElementById('delay-selector');
  delay = selector.value;
}

function spreadPaint(context, pointCount) {
  if (!pointCount) pointCount = 10;

  if (!context) {
    const canvasElement = document.getElementById('drawing-canvas');
    context = canvasElement.getContext("2d");
  }

  const maxHeight = context.canvas.height;
  const maxWidth = context.canvas.width;

  const colorSet = [ // R, G, B, A
    [255, 0, 0, 255], // red
    [0, 255, 0, 255], // green
    [0, 0, 255, 255], // blue
    [255, 255, 0, 255], // yellow
    [0, 0, 0, 255], // black
  ];

  for (let pointNo = 1; pointNo <= pointCount; pointNo += 1) {
    const randX = Math.floor(Math.random() * maxWidth);
    const randY = Math.floor(Math.random() * maxHeight);

    let paintColor = colorSet[pointNo % colorSet.length];
    if (pointCount < colorSet.length) {
      paintColor = colorSet[Math.floor(Math.random() * colorSet.length)];
    }

    bucketFill(context, randX, randY, paintColor);
  }

  nextPaintingStep = () => spreadPaint(context, pointCount);
  paintTimeOut = setTimeout(nextPaintingStep, delay);
}

function bucketFill(context, posX, posY, fillColor) {
  const maxHeight = context.canvas.clientHeight;
  const maxWidth = context.canvas.clientWidth;
  const maxPaintArea = Math.floor((maxWidth / 10) * (maxHeight / 10));

  // console.log(`Bucket at ${posX}:${posY} max ${maxPaintArea} with `, fillColor);

  const currentPoint = context.getImageData(posX, posY, 1, 1).data;
  if (currentPoint[3] !== 0) {
    // console.log("Point already painted with ", currentPoint);
    return;
  }

  const fillKeyGen = (keyX,keyY) => `${keyX}:${keyY}`;
  const fillList = {};
  const cellStack = [[posX, posY]];
  fillList[fillKeyGen(posX, posY)] = [posX, posY];
  let paintArea = 0;

  while (cellStack.length > 0 && paintArea < maxPaintArea) {
    const [currentX, currentY] = cellStack.shift();

    for (let checkX = currentX - 1; checkX <= currentX + 1; checkX += 1) {
      if (checkX < 0 || checkX > maxWidth) continue;

      for (let checkY = currentY - 1; checkY <= currentY + 1; checkY += 1) {
        if (checkY < 0 || checkY > maxHeight) continue;

        const fillKey = fillKeyGen(checkX, checkY);
        if (fillList[fillKey]) continue;

        // check if already painted
        const paintPoint = context.getImageData(checkX, checkY, 1, 1).data;
        if (paintPoint[3] !== 0) continue;

        const pointCoords = [checkX, checkY];
        fillList[fillKey] = pointCoords;
        cellStack.push(pointCoords);
        paintArea += 1;
      }
    }
  }

  if (paintArea >= maxPaintArea) {
    // console.log(`Area too large, max ${maxPaintArea}`);
    return;
  }

  // console.log(`Paint it over ${paintArea}`);
  for (const [paintX, paintY] of Object.values(fillList)) {
    const imageData = new ImageData(new Uint8ClampedArray(fillColor), 1, 1);
    context.putImageData(imageData, paintX, paintY);
  }
}

function init() {
  const canvasHolder = document.getElementById('canvas-container');

  const containerWidth = canvasHolder.clientWidth || 1000;
  const containerHeight = canvasHolder.clientHeight || 800;

  const canvas = document.createElement('canvas');
  canvas.id = "drawing-canvas";
  canvas.width = containerWidth;
  canvas.height = containerHeight;

  canvasHolder.appendChild(canvas);

  drawing(canvas.getContext("2d"));
}

init();
