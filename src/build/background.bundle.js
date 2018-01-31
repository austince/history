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
  currentTab = port.sender.tab;
  currentPort = port;
  ports[currentTab.id] = port;
  currentPort.onMessage.addListener(messageHandler);
  initTab();
});

async function initTab() {
  // send history
  // let result = await chromep.storage.sync.get('history');
  // const history = result.history || [];
  currentPort.postMessage({ action: 'init', history: globalHistory });
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

  // Pause the history collection in the background
  currentPort.postMessage({ action: 'pause' });

  const tab = await chromep.tabs.get(tabId);

  // let result = await chromep.storage.sync.get('history');
  if (currentTab) {
    // Update all the history items for the offset of the tab that's been clicked
    // (new index - current index) * window.clientWidth
    // const history = result.history;
    const offset = (tab.index - currentTab.index) * tab.width;
    for (let item of globalHistory) {
      console.log(item);
    }
    // Save it
    // await chromep.storage.sync.set({ history });
  }

  currentTab = tab;
  if (ports[tab.id]) {
    currentPort = ports[tab.id];
    initTab();
  }
  // otherwise wait for it to connect
});

},{"chrome-promise":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY2hyb21lLXByb21pc2UvY2hyb21lLXByb21pc2UuanMiLCJzcmMvYmFja2dyb3VuZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG4gKiBjaHJvbWUtcHJvbWlzZVxuICogaHR0cHM6Ly9naXRodWIuY29tL3Rmb3h5L2Nocm9tZS1wcm9taXNlXG4gKlxuICogQ29weXJpZ2h0IDIwMTUgVG9tw6FzIEZveFxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKi9cblxuKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cbiAgICBkZWZpbmUoW10sIGZhY3RvcnkuYmluZChudWxsLCB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgPyB0aGlzIDogcm9vdCkpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgIC8vIE5vZGUuIERvZXMgbm90IHdvcmsgd2l0aCBzdHJpY3QgQ29tbW9uSlMsIGJ1dFxuICAgIC8vIG9ubHkgQ29tbW9uSlMtbGlrZSBlbnZpcm9ubWVudHMgdGhhdCBzdXBwb3J0IG1vZHVsZS5leHBvcnRzLFxuICAgIC8vIGxpa2UgTm9kZS5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkodGhpcyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gQnJvd3NlciBnbG9iYWxzIChyb290IGlzIHdpbmRvdylcbiAgICByb290LkNocm9tZVByb21pc2UgPSBmYWN0b3J5KHJvb3QpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uKHJvb3QpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICB2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UsXG4gICAgICBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbiAgLy8gVGVtcG9yYXJ5IGhhY2t5IGZpeCB0byBtYWtlIFR5cGVTY3JpcHQgYGltcG9ydGAgd29ya1xuICBDaHJvbWVQcm9taXNlLmRlZmF1bHQgPSBDaHJvbWVQcm9taXNlO1xuXG4gIHJldHVybiBDaHJvbWVQcm9taXNlO1xuXG4gIC8vLy8vLy8vLy8vLy8vLy9cblxuICBmdW5jdGlvbiBDaHJvbWVQcm9taXNlKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgY2hyb21lID0gb3B0aW9ucy5jaHJvbWUgfHwgcm9vdC5jaHJvbWU7XG4gICAgdmFyIFByb21pc2UgPSBvcHRpb25zLlByb21pc2UgfHwgcm9vdC5Qcm9taXNlO1xuICAgIHZhciBydW50aW1lID0gY2hyb21lLnJ1bnRpbWU7XG5cbiAgICBmaWxsUHJvcGVydGllcyhjaHJvbWUsIHRoaXMpO1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgZnVuY3Rpb24gc2V0UHJvbWlzZUZ1bmN0aW9uKGZuLCB0aGlzQXJnKSB7XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgIGFyZ3MucHVzaChjYWxsYmFjayk7XG5cbiAgICAgICAgICBmbi5hcHBseSh0aGlzQXJnLCBhcmdzKTtcblxuICAgICAgICAgIGZ1bmN0aW9uIGNhbGxiYWNrKCkge1xuICAgICAgICAgICAgdmFyIGVyciA9IHJ1bnRpbWUubGFzdEVycm9yO1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc3dpdGNoIChyZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0c1swXSk7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHRzKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgIH07XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaWxsUHJvcGVydGllcyhzb3VyY2UsIHRhcmdldCkge1xuICAgICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHtcbiAgICAgICAgICB2YXIgdmFsID0gc291cmNlW2tleV07XG4gICAgICAgICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsO1xuXG4gICAgICAgICAgaWYgKHR5cGUgPT09ICdvYmplY3QnICYmICEodmFsIGluc3RhbmNlb2YgQ2hyb21lUHJvbWlzZSkpIHtcbiAgICAgICAgICAgIHRhcmdldFtrZXldID0ge307XG4gICAgICAgICAgICBmaWxsUHJvcGVydGllcyh2YWwsIHRhcmdldFtrZXldKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRhcmdldFtrZXldID0gc2V0UHJvbWlzZUZ1bmN0aW9uKHZhbCwgc291cmNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSB2YWw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59KSk7XG4iLCJjb25zdCBjaHJvbWVwID0gbmV3IChyZXF1aXJlKCdjaHJvbWUtcHJvbWlzZScpKSgpO1xuXG5sZXQgY3VycmVudFBvcnQgPSBudWxsO1xubGV0IGN1cnJlbnRUYWIgPSBudWxsO1xuY29uc3QgYmFja3VwSW50ZXJ2b2wgPSAxMDAwO1xuY29uc3QgcG9ydHMgPSB7fTtcbmxldCBnbG9iYWxIaXN0b3J5ID0gW107XG5cbmNocm9tZS5ydW50aW1lLm9uQ29ubmVjdC5hZGRMaXN0ZW5lcihhc3luYyBmdW5jdGlvbiAocG9ydCkge1xuICBjdXJyZW50VGFiID0gcG9ydC5zZW5kZXIudGFiO1xuICBjdXJyZW50UG9ydCA9IHBvcnQ7XG4gIHBvcnRzW2N1cnJlbnRUYWIuaWRdID0gcG9ydDtcbiAgY3VycmVudFBvcnQub25NZXNzYWdlLmFkZExpc3RlbmVyKG1lc3NhZ2VIYW5kbGVyKTtcbiAgaW5pdFRhYigpO1xufSk7XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRUYWIoKSB7XG4gIC8vIHNlbmQgaGlzdG9yeVxuICAvLyBsZXQgcmVzdWx0ID0gYXdhaXQgY2hyb21lcC5zdG9yYWdlLnN5bmMuZ2V0KCdoaXN0b3J5Jyk7XG4gIC8vIGNvbnN0IGhpc3RvcnkgPSByZXN1bHQuaGlzdG9yeSB8fCBbXTtcbiAgY3VycmVudFBvcnQucG9zdE1lc3NhZ2UoeyBhY3Rpb246ICdpbml0JywgaGlzdG9yeTogZ2xvYmFsSGlzdG9yeSB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbWVzc2FnZUhhbmRsZXIobWVzc2FnZSkge1xuICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgaWYgKG1lc3NhZ2UuYWN0aW9uID09PSAnT0snKSB7XG4gICAgaGlzdG9yeU1lc3NhZ2VEZWxheSgpO1xuICB9IGVsc2UgaWYgKG1lc3NhZ2UuYWN0aW9uID09PSAnaGlzdG9yeVNlbnQnKSB7XG4gICAgLy8gVXBkYXRlIGl0XG4gICAgdHJ5IHtcbiAgICAgIC8vIGF3YWl0IGNocm9tZXAuc3RvcmFnZS5zeW5jLnNldCh7IGhpc3RvcnkgfSk7XG4gICAgICBnbG9iYWxIaXN0b3J5ID0gWy4uLm1lc3NhZ2UuaGlzdG9yeV07XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfVxuXG4gICAgaGlzdG9yeU1lc3NhZ2VEZWxheSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhpc3RvcnlNZXNzYWdlRGVsYXkoKSB7XG4gIC8vIEluaXRpYWwgaGlzdG9yeSBiYWNrdXAgbG9vcFxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnUmVjb3JkaW5nIGhpc3RvcnknKTtcbiAgICAvLyBGZXRjaCB0aGUgaGlzdG9yeSBmcm9tIHRoZSBjdXJyZW50IHRhYlxuICAgIGN1cnJlbnRQb3J0LnBvc3RNZXNzYWdlKHsgYWN0aW9uOiAnc2VuZEhpc3RvcnknIH0pO1xuICB9LCBiYWNrdXBJbnRlcnZvbCk7XG59XG5cbmNocm9tZS50YWJzLm9uQWN0aXZhdGVkLmFkZExpc3RlbmVyKGFzeW5jICh7IHRhYklkLCB3aW5kb3dJZCB9KSA9PiB7XG4gIGNvbnNvbGUubG9nKGAke3RhYklkfSBhY3RpdmF0ZWRgKTtcblxuICAvLyBQYXVzZSB0aGUgaGlzdG9yeSBjb2xsZWN0aW9uIGluIHRoZSBiYWNrZ3JvdW5kXG4gIGN1cnJlbnRQb3J0LnBvc3RNZXNzYWdlKHsgYWN0aW9uOiAncGF1c2UnIH0pO1xuXG4gIGNvbnN0IHRhYiA9IGF3YWl0IGNocm9tZXAudGFicy5nZXQodGFiSWQpO1xuXG4gIC8vIGxldCByZXN1bHQgPSBhd2FpdCBjaHJvbWVwLnN0b3JhZ2Uuc3luYy5nZXQoJ2hpc3RvcnknKTtcbiAgaWYgKGN1cnJlbnRUYWIpIHtcbiAgICAvLyBVcGRhdGUgYWxsIHRoZSBoaXN0b3J5IGl0ZW1zIGZvciB0aGUgb2Zmc2V0IG9mIHRoZSB0YWIgdGhhdCdzIGJlZW4gY2xpY2tlZFxuICAgIC8vIChuZXcgaW5kZXggLSBjdXJyZW50IGluZGV4KSAqIHdpbmRvdy5jbGllbnRXaWR0aFxuICAgIC8vIGNvbnN0IGhpc3RvcnkgPSByZXN1bHQuaGlzdG9yeTtcbiAgICBjb25zdCBvZmZzZXQgPSAodGFiLmluZGV4IC0gY3VycmVudFRhYi5pbmRleCkgKiB0YWIud2lkdGg7XG4gICAgZm9yIChsZXQgaXRlbSBvZiBnbG9iYWxIaXN0b3J5KSB7XG4gICAgICBjb25zb2xlLmxvZyhpdGVtKTtcbiAgICB9XG4gICAgLy8gU2F2ZSBpdFxuICAgIC8vIGF3YWl0IGNocm9tZXAuc3RvcmFnZS5zeW5jLnNldCh7IGhpc3RvcnkgfSk7XG4gIH1cblxuICBjdXJyZW50VGFiID0gdGFiO1xuICBpZiAocG9ydHNbdGFiLmlkXSkge1xuICAgIGN1cnJlbnRQb3J0ID0gcG9ydHNbdGFiLmlkXTtcbiAgICBpbml0VGFiKCk7XG4gIH1cbiAgLy8gb3RoZXJ3aXNlIHdhaXQgZm9yIGl0IHRvIGNvbm5lY3Rcbn0pO1xuIl19
