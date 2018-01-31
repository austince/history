(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * chrome-promise
 * https://github.com/tfoxy/chrome-promise
 *
 * Copyright 2015 Tomás Fox
 * Released under the MIT license
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory.bind(null, typeof exports === 'object' ? this : root));
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(this);
  } else {
    // Browser globals (root is window)
    root.ChromePromise = factory(root);
  }
}(this, function(root) {
  'use strict';
  var slice = Array.prototype.slice,
      hasOwnProperty = Object.prototype.hasOwnProperty;

  // Temporary hacky fix to make TypeScript `import` work
  ChromePromise.default = ChromePromise;

  return ChromePromise;

  ////////////////

  function ChromePromise(options) {
    options = options || {};
    var chrome = options.chrome || root.chrome;
    var Promise = options.Promise || root.Promise;
    var runtime = chrome.runtime;

    fillProperties(chrome, this);

    ////////////////

    function setPromiseFunction(fn, thisArg) {

      return function() {
        var args = slice.call(arguments);

        return new Promise(function(resolve, reject) {
          args.push(callback);

          fn.apply(thisArg, args);

          function callback() {
            var err = runtime.lastError;
            var results = slice.call(arguments);
            if (err) {
              reject(err);
            } else {
              switch (results.length) {
                case 0:
                  resolve();
                  break;
                case 1:
                  resolve(results[0]);
                  break;
                default:
                  resolve(results);
              }
            }
          }
        });

      };

    }

    function fillProperties(source, target) {
      for (var key in source) {
        if (hasOwnProperty.call(source, key)) {
          var val = source[key];
          var type = typeof val;

          if (type === 'object' && !(val instanceof ChromePromise)) {
            target[key] = {};
            fillProperties(val, target[key]);
          } else if (type === 'function') {
            target[key] = setPromiseFunction(val, source);
          } else {
            target[key] = val;
          }
        }
      }
    }
  }
}));

},{}],2:[function(require,module,exports){
const chromep = new (require('chrome-promise'))();

let currentPort = null;
let currentTab = null;
const backupIntervol = 1000;
const ports = {};
let globalHistory = [];

chrome.runtime.onConnect.addListener(async function (port) {
  ports[port.sender.tab.id] = port;

  if (!port.sender.tab.active) {
    return;
  }

  if (currentTab == null) {
    setCurrent(port);
  }
  // Remove port on disconnect
  // currentPort.onDisconnect.addListener(disconnected => {
  //   ports[disconnected.sender.tab.id] = null;
  // });
  initTab(currentPort);
});


function setCurrent(port) {
  currentTab = port.sender.tab;
  currentPort = port;
  currentPort.onMessage.addListener(messageHandler);
}

async function initTab(port) {
  // send history
  // let result = await chromep.storage.sync.get('history');
  // const history = result.history || [];
  console.log(`Initiating ${currentTab.id}`);
  port.postMessage({ action: 'init', history: globalHistory });
}

async function messageHandler(message) {
  console.log(message);
  if (message.action === 'OK') {
    historyMessageDelay();
  } else if (message.action === 'historySent') {
    // Update it
    try {
      // await chromep.storage.sync.set({ history });
      globalHistory = [...message.history];
    } catch (err) {
      console.error(err);
    }

    historyMessageDelay();
  }
}

function historyMessageDelay() {
  // Initial history backup loop
  setTimeout(() => {
    console.log('Recording history');
    // Fetch the history from the current tab
    currentPort.postMessage({ action: 'sendHistory' });
  }, backupIntervol);
}

chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  console.log(`${tabId} activated`);

  const tab = await chromep.tabs.get(tabId);

  if (!tab.active) {
    // only initiate active tabs
    return;
  }

  // let result = await chromep.storage.sync.get('history');
  if (currentTab) {
    // Pause the history collection in the background
    console.log(`Pausing tab ${currentTab.id}`);
    currentPort.postMessage({ action: 'pause' });

    // Update all the history items for the offset of the tab that's been clicked
    // (new index - current index) * window.clientWidth
    // const history = result.history;
    const offset = (tab.index - currentTab.index) * tab.width;
    console.log(offset);
    for (let item of globalHistory) {
      console.log(item);
      item.position.x += offset;
    }
    // Save it
    // await chromep.storage.sync.set({ history });
  }


  if (ports[tab.id]) {
    console.log(`Reconnecting to ${tab.id}`);
    setCurrent(ports[tab.id]);
    initTab(currentPort);
  }
  // otherwise wait for it to connect
});

},{"chrome-promise":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY2hyb21lLXByb21pc2UvY2hyb21lLXByb21pc2UuanMiLCJzcmMvYmFja2dyb3VuZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIVxuICogY2hyb21lLXByb21pc2VcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS90Zm94eS9jaHJvbWUtcHJvbWlzZVxuICpcbiAqIENvcHlyaWdodCAyMDE1IFRvbcOhcyBGb3hcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICovXG5cbihmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG4gICAgZGVmaW5lKFtdLCBmYWN0b3J5LmJpbmQobnVsbCwgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnID8gdGhpcyA6IHJvb3QpKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAvLyBOb2RlLiBEb2VzIG5vdCB3b3JrIHdpdGggc3RyaWN0IENvbW1vbkpTLCBidXRcbiAgICAvLyBvbmx5IENvbW1vbkpTLWxpa2UgZW52aXJvbm1lbnRzIHRoYXQgc3VwcG9ydCBtb2R1bGUuZXhwb3J0cyxcbiAgICAvLyBsaWtlIE5vZGUuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHRoaXMpO1xuICB9IGVsc2Uge1xuICAgIC8vIEJyb3dzZXIgZ2xvYmFscyAocm9vdCBpcyB3aW5kb3cpXG4gICAgcm9vdC5DaHJvbWVQcm9taXNlID0gZmFjdG9yeShyb290KTtcbiAgfVxufSh0aGlzLCBmdW5jdGlvbihyb290KSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgdmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLFxuICAgICAgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4gIC8vIFRlbXBvcmFyeSBoYWNreSBmaXggdG8gbWFrZSBUeXBlU2NyaXB0IGBpbXBvcnRgIHdvcmtcbiAgQ2hyb21lUHJvbWlzZS5kZWZhdWx0ID0gQ2hyb21lUHJvbWlzZTtcblxuICByZXR1cm4gQ2hyb21lUHJvbWlzZTtcblxuICAvLy8vLy8vLy8vLy8vLy8vXG5cbiAgZnVuY3Rpb24gQ2hyb21lUHJvbWlzZShvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdmFyIGNocm9tZSA9IG9wdGlvbnMuY2hyb21lIHx8IHJvb3QuY2hyb21lO1xuICAgIHZhciBQcm9taXNlID0gb3B0aW9ucy5Qcm9taXNlIHx8IHJvb3QuUHJvbWlzZTtcbiAgICB2YXIgcnVudGltZSA9IGNocm9tZS5ydW50aW1lO1xuXG4gICAgZmlsbFByb3BlcnRpZXMoY2hyb21lLCB0aGlzKTtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGZ1bmN0aW9uIHNldFByb21pc2VGdW5jdGlvbihmbiwgdGhpc0FyZykge1xuXG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICBhcmdzLnB1c2goY2FsbGJhY2spO1xuXG4gICAgICAgICAgZm4uYXBwbHkodGhpc0FyZywgYXJncyk7XG5cbiAgICAgICAgICBmdW5jdGlvbiBjYWxsYmFjaygpIHtcbiAgICAgICAgICAgIHZhciBlcnIgPSBydW50aW1lLmxhc3RFcnJvcjtcbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN3aXRjaCAocmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdHNbMF0pO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0cyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICB9O1xuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsbFByb3BlcnRpZXMoc291cmNlLCB0YXJnZXQpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7XG4gICAgICAgICAgdmFyIHZhbCA9IHNvdXJjZVtrZXldO1xuICAgICAgICAgIHZhciB0eXBlID0gdHlwZW9mIHZhbDtcblxuICAgICAgICAgIGlmICh0eXBlID09PSAnb2JqZWN0JyAmJiAhKHZhbCBpbnN0YW5jZW9mIENocm9tZVByb21pc2UpKSB7XG4gICAgICAgICAgICB0YXJnZXRba2V5XSA9IHt9O1xuICAgICAgICAgICAgZmlsbFByb3BlcnRpZXModmFsLCB0YXJnZXRba2V5XSk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0YXJnZXRba2V5XSA9IHNldFByb21pc2VGdW5jdGlvbih2YWwsIHNvdXJjZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRhcmdldFtrZXldID0gdmFsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufSkpO1xuIiwiY29uc3QgY2hyb21lcCA9IG5ldyAocmVxdWlyZSgnY2hyb21lLXByb21pc2UnKSkoKTtcblxubGV0IGN1cnJlbnRQb3J0ID0gbnVsbDtcbmxldCBjdXJyZW50VGFiID0gbnVsbDtcbmNvbnN0IGJhY2t1cEludGVydm9sID0gMTAwMDtcbmNvbnN0IHBvcnRzID0ge307XG5sZXQgZ2xvYmFsSGlzdG9yeSA9IFtdO1xuXG5jaHJvbWUucnVudGltZS5vbkNvbm5lY3QuYWRkTGlzdGVuZXIoYXN5bmMgZnVuY3Rpb24gKHBvcnQpIHtcbiAgcG9ydHNbcG9ydC5zZW5kZXIudGFiLmlkXSA9IHBvcnQ7XG5cbiAgaWYgKCFwb3J0LnNlbmRlci50YWIuYWN0aXZlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGN1cnJlbnRUYWIgPT0gbnVsbCkge1xuICAgIHNldEN1cnJlbnQocG9ydCk7XG4gIH1cbiAgLy8gUmVtb3ZlIHBvcnQgb24gZGlzY29ubmVjdFxuICAvLyBjdXJyZW50UG9ydC5vbkRpc2Nvbm5lY3QuYWRkTGlzdGVuZXIoZGlzY29ubmVjdGVkID0+IHtcbiAgLy8gICBwb3J0c1tkaXNjb25uZWN0ZWQuc2VuZGVyLnRhYi5pZF0gPSBudWxsO1xuICAvLyB9KTtcbiAgaW5pdFRhYihjdXJyZW50UG9ydCk7XG59KTtcblxuXG5mdW5jdGlvbiBzZXRDdXJyZW50KHBvcnQpIHtcbiAgY3VycmVudFRhYiA9IHBvcnQuc2VuZGVyLnRhYjtcbiAgY3VycmVudFBvcnQgPSBwb3J0O1xuICBjdXJyZW50UG9ydC5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIobWVzc2FnZUhhbmRsZXIpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0VGFiKHBvcnQpIHtcbiAgLy8gc2VuZCBoaXN0b3J5XG4gIC8vIGxldCByZXN1bHQgPSBhd2FpdCBjaHJvbWVwLnN0b3JhZ2Uuc3luYy5nZXQoJ2hpc3RvcnknKTtcbiAgLy8gY29uc3QgaGlzdG9yeSA9IHJlc3VsdC5oaXN0b3J5IHx8IFtdO1xuICBjb25zb2xlLmxvZyhgSW5pdGlhdGluZyAke2N1cnJlbnRUYWIuaWR9YCk7XG4gIHBvcnQucG9zdE1lc3NhZ2UoeyBhY3Rpb246ICdpbml0JywgaGlzdG9yeTogZ2xvYmFsSGlzdG9yeSB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbWVzc2FnZUhhbmRsZXIobWVzc2FnZSkge1xuICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgaWYgKG1lc3NhZ2UuYWN0aW9uID09PSAnT0snKSB7XG4gICAgaGlzdG9yeU1lc3NhZ2VEZWxheSgpO1xuICB9IGVsc2UgaWYgKG1lc3NhZ2UuYWN0aW9uID09PSAnaGlzdG9yeVNlbnQnKSB7XG4gICAgLy8gVXBkYXRlIGl0XG4gICAgdHJ5IHtcbiAgICAgIC8vIGF3YWl0IGNocm9tZXAuc3RvcmFnZS5zeW5jLnNldCh7IGhpc3RvcnkgfSk7XG4gICAgICBnbG9iYWxIaXN0b3J5ID0gWy4uLm1lc3NhZ2UuaGlzdG9yeV07XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfVxuXG4gICAgaGlzdG9yeU1lc3NhZ2VEZWxheSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhpc3RvcnlNZXNzYWdlRGVsYXkoKSB7XG4gIC8vIEluaXRpYWwgaGlzdG9yeSBiYWNrdXAgbG9vcFxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnUmVjb3JkaW5nIGhpc3RvcnknKTtcbiAgICAvLyBGZXRjaCB0aGUgaGlzdG9yeSBmcm9tIHRoZSBjdXJyZW50IHRhYlxuICAgIGN1cnJlbnRQb3J0LnBvc3RNZXNzYWdlKHsgYWN0aW9uOiAnc2VuZEhpc3RvcnknIH0pO1xuICB9LCBiYWNrdXBJbnRlcnZvbCk7XG59XG5cbmNocm9tZS50YWJzLm9uQWN0aXZhdGVkLmFkZExpc3RlbmVyKGFzeW5jICh7IHRhYklkLCB3aW5kb3dJZCB9KSA9PiB7XG4gIGNvbnNvbGUubG9nKGAke3RhYklkfSBhY3RpdmF0ZWRgKTtcblxuICBjb25zdCB0YWIgPSBhd2FpdCBjaHJvbWVwLnRhYnMuZ2V0KHRhYklkKTtcblxuICBpZiAoIXRhYi5hY3RpdmUpIHtcbiAgICAvLyBvbmx5IGluaXRpYXRlIGFjdGl2ZSB0YWJzXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gbGV0IHJlc3VsdCA9IGF3YWl0IGNocm9tZXAuc3RvcmFnZS5zeW5jLmdldCgnaGlzdG9yeScpO1xuICBpZiAoY3VycmVudFRhYikge1xuICAgIC8vIFBhdXNlIHRoZSBoaXN0b3J5IGNvbGxlY3Rpb24gaW4gdGhlIGJhY2tncm91bmRcbiAgICBjb25zb2xlLmxvZyhgUGF1c2luZyB0YWIgJHtjdXJyZW50VGFiLmlkfWApO1xuICAgIGN1cnJlbnRQb3J0LnBvc3RNZXNzYWdlKHsgYWN0aW9uOiAncGF1c2UnIH0pO1xuXG4gICAgLy8gVXBkYXRlIGFsbCB0aGUgaGlzdG9yeSBpdGVtcyBmb3IgdGhlIG9mZnNldCBvZiB0aGUgdGFiIHRoYXQncyBiZWVuIGNsaWNrZWRcbiAgICAvLyAobmV3IGluZGV4IC0gY3VycmVudCBpbmRleCkgKiB3aW5kb3cuY2xpZW50V2lkdGhcbiAgICAvLyBjb25zdCBoaXN0b3J5ID0gcmVzdWx0Lmhpc3Rvcnk7XG4gICAgY29uc3Qgb2Zmc2V0ID0gKHRhYi5pbmRleCAtIGN1cnJlbnRUYWIuaW5kZXgpICogdGFiLndpZHRoO1xuICAgIGNvbnNvbGUubG9nKG9mZnNldCk7XG4gICAgZm9yIChsZXQgaXRlbSBvZiBnbG9iYWxIaXN0b3J5KSB7XG4gICAgICBjb25zb2xlLmxvZyhpdGVtKTtcbiAgICAgIGl0ZW0ucG9zaXRpb24ueCArPSBvZmZzZXQ7XG4gICAgfVxuICAgIC8vIFNhdmUgaXRcbiAgICAvLyBhd2FpdCBjaHJvbWVwLnN0b3JhZ2Uuc3luYy5zZXQoeyBoaXN0b3J5IH0pO1xuICB9XG5cblxuICBpZiAocG9ydHNbdGFiLmlkXSkge1xuICAgIGNvbnNvbGUubG9nKGBSZWNvbm5lY3RpbmcgdG8gJHt0YWIuaWR9YCk7XG4gICAgc2V0Q3VycmVudChwb3J0c1t0YWIuaWRdKTtcbiAgICBpbml0VGFiKGN1cnJlbnRQb3J0KTtcbiAgfVxuICAvLyBvdGhlcndpc2Ugd2FpdCBmb3IgaXQgdG8gY29ubmVjdFxufSk7XG4iXX0=
