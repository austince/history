require('p5/lib/addons/p5.dom');
const p5 = require('p5');
const chromep = new (require('chrome-promise'))();



const historyItemClassName = '--history-item';
const historyContainerId = '--history-container';
const angleStep = 0.01;
const radius = 2;
const moveStep = 0.0001;
const fadeStep = -0.0001;

let historyItems = [];

const port = chrome.runtime.connect({ name: 'history' });
port.onMessage.addListener(function (message) {
  if (message.action === 'init') {
    historyItems = message.history;

    for (let item of historyItems) {

    }

    port.postMessage({ action: 'OK' });
  } else if (message.action === 'sendHistory') {
    port.postMessage({ action: 'historySent', history: historyItems  })
  }
});

/*
 * interface HistoryItem {
 * 	elem: p5.Element;
 * 	timeSaved: Date;
 * 	moveSpeed: number;
 * 	angle: number;
 * }
 */
const sketch = (p) => {
  let mousePageX,
    mousePageY;
  let historyContainer;

  /*
  Helper Functions
   */
  function closestNodeToMouse() {
    if (!mousePageX || !mousePageY) {
      return null;
    }

    // Filter out all history-items and sort by smallest area
    const elems = document.elementsFromPoint(mousePageX, mousePageY)
      .filter(node => {
        const notHistoryItem = typeof node.className === 'undefined' ?
          true :
          node.className.indexOf(historyItemClassName) === -1;

        return notHistoryItem
          // && node.clientWidth < window.innerWidth / 2
          && node.clientHeight < window.innerHeight / 2
      })
      .sort((nodeA, nodeB) => {
        return (nodeA.clientWidth * nodeA.clientHeight) - (nodeB.clientWidth * nodeB.clientHeight);
      });

    return elems.length === 0 ? null : elems[0];
  }

  function addClosestToHistory() {
    const node = closestNodeToMouse();
    if (node) {
      console.log(`Adding ${node}`);
      const elem = new p5.Element(node.cloneNode(true)); // deep clone
      elem.parent(historyContainer);
      elem.addClass(historyItemClassName);
      elem.position(mousePageX, mousePageY);

      console.log(mousePageX, mousePageY);

      historyItems.push({
        elem,
        timeSaved: new Date(),
        moveSpeed: 1,
        angle: p.random(0, 360),
        opacity: 1,
      });
    }
  }

  function addToHistoryLoop() {
    console.log('History is in the making.');
    addClosestToHistory();
    setTimeout(addToHistoryLoop, p.random(5000, 10000));
  }


  /* p5 lifecycle functions */

  p.setup = () => {
    p.createCanvas(0, 0);
    p.frameRate(60);
    historyContainer = p.createDiv('')
      .id(historyContainerId)
      .parent(document.body);

    addToHistoryLoop();
  };

  p.draw = () => {
    // console.log('draw' + p.frameCount);
    for (const [index, item] of historyItems.entries()) {
      // console.log(index);
      // Update opacity
      item.elem.style('opacity', item.opacity);

      // Update position
      const { x, y } = item.elem.position();

      const itemPosVec = new p5.Vector(x, y);
      const mouseVec = new p5.Vector(mousePageX, mousePageY);
      const distVec = new p5.Vector(mouseVec.x - x, mouseVec.y - y);

      const moveVec = distVec.copy()
        .normalize()
        .mult(item.moveSpeed)
        .add(p.cos(item.angle) * radius, p.sin(item.angle) * radius);
      itemPosVec.add(moveVec);

      // Update values
      item.elem.position(itemPosVec.x, itemPosVec.y);
      item.angle += p.random(0, angleStep);
      // item.moveSpeed = p.constrain(moveStep + moveStep, 0.1, 100);
      item.opacity += p.random(0, fadeStep);

      // remove the forgotten
      if (item.opacity < 0) {
        historyItems.splice(index, 1);
      }
    }
  };

  /**
   * Record actual page mouse coords
   * @param event
   */
  p.mouseMoved = (event) => {
    mousePageX = event.pageX;
    mousePageY = event.pageY;
  };

  p.mousePressed = () => {
    addClosestToHistory();
  }
};

// Start the sketch
new p5(sketch);
