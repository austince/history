require('p5/lib/addons/p5.dom');
const p5 = require('p5');
const { cloneDeep } = require('lodash');

console.log('Content script injected.');
const historyItemClassName = '--history-item';
const historyContainerId = '--history-container';
const angleStep = 0.01;
const radius = 2;
const moveStep = 0.0001;
const fadeStep = -0.0001;

let historyItems = [];

let port;


/**
 * @param {String} html representing a single element
 * @return {Node}
 */
function htmlToElement(html) {
  const template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

/*
 * interface HistoryItem {
 * 	elem: p5.Element;
 * 	timeSaved: Date;
 * 	moveSpeed: number;
 * 	angle: number;
 * }
 */

/*
 * interface StoredHistoryItem {
 *  html: string;
 *  timeSaved: Date;
 *  moveSpeed: number;
 *  angle: number;
 *  position: { x: number, y: number }
 * }
 *
 */

const sketch = (p) => {
  let mousePageX,
    mousePageY;
  let mouseClientX,
    mouseClientY;
  let historyLoopId = null;
  let historyContainer;

  /*
  Helper Functions
   */
  function closestNodeToMouse() {
    if (!mousePageX || !mousePageY) {
      return null;
    }
    // Must use client x y to get nearest elements
    // console.log('Closest nodes:');
    // console.log(mousePageX, mousePageY, document.elementsFromPoint(mousePageX, mousePageY));
    // console.log(mouseClientX, mouseClientY, document.elementsFromPoint(mouseClientX, mouseClientY));

    // Filter out all history-items and sort by smallest area
    const elems = document.elementsFromPoint(mouseClientX, mouseClientY)
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
      const elem = new p5.Element(node.cloneNode(true), p); // deep clone
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
    historyLoopId = setTimeout(addToHistoryLoop, p.random(5000, 10000));
  }

  function stopLoops() {
    p.noLoop(); // Stop the draw loop

    if (historyLoopId) {
      clearTimeout(historyLoopId);
    }
  }

  function startLoops() {
    addToHistoryLoop();
    p.loop();
  }

  function setupPort() {
    port = chrome.runtime.connect({ name: 'history' });
    // Listen for messages
    port.onDisconnect.addListener(() => {
      console.log('Disconnected.');
      stopLoops();
      port = null;
    });

    port.onMessage.addListener(function (message) {
      if (message.action === 'init') {
        // just remove all elements
        // Might make this more efficient than just deleting and re-adding in the future
        if (historyContainer) {
          historyContainer.remove();
        }

        historyContainer = p.createDiv('')
          .id(historyContainerId)
          .parent(document.body);

        // Deconstruct from storage and attach to the container
        historyItems = message.history;
        historyItems.forEach(item => {
          item.elem = new p5.Element(htmlToElement(item.html), p);
          item.elem.parent(historyContainer);
          const { x, y } = item.position;
          item.elem.position(x, y);
          item.timeSaved = new Date(item.timeSaved);
          delete item.position;
          delete item.html;
        });
        // Start loops
        startLoops();
        port.postMessage({ action: 'initDone' });
        console.log('Initialized');
      } else if (message.action === 'pause') {
        console.log('Paused');
        stopLoops();
      } else if (message.action === 'sendHistory') {
        // Format the historyItems for storage
        const historyFmt = historyItems.map(item => {
          const itemFmt = cloneDeep(item);
          itemFmt.html = item.elem.elt.outerHTML;
          itemFmt.position = itemFmt.elem.position();
          itemFmt.timeSaved = item.timeSaved.toDateString();
          delete itemFmt.elem;
          return itemFmt;
        });

        console.log('Sending history.');
        port.postMessage({ action: 'historySent', history: historyFmt })
      }
    });

    // Let them know we're ready to be initialized
    port.postMessage({ action: 'ready' });
  }


  /* p5 lifecycle functions */

  p.setup = () => {
    p.createCanvas(0, 0);
    p.frameRate(60);

    chrome.runtime.onMessage.addListener((message, sender, sendRes) => {
      if (message.action === 'activated') {
        // We've got the go ahead to get into the ready state and open a port
        // Connect to the port
        console.log('Activated => Entering ready state.');
        setupPort();
      } else if (message.action === 'pause') {
        console.log('Paused => Entering ready state');
        stopLoops();
      }
    });

    // Wait until setup
    p.noLoop();
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
        .add(p.cos(item.angle) * radius, p.sin(item.angle) * radius)
        .mult(item.moveSpeed);
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
   * @param {Event} event
   */
  p.mouseMoved = (event) => {
    mousePageX = event.pageX;
    mousePageY = event.pageY;
    mouseClientX = event.clientX;
    mouseClientY = event.clientY;
  };

  /**
   * For development
   */
  p.mousePressed = () => {
    // addClosestToHistory();
  }
};

// Start the sketch
new p5(sketch);
