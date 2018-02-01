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
/**
 * background.js
 * In charge of:
 * - coordinating tab states
 * - recording history
 * - updating history when active tab changes
 */

const chromep = new (require('chrome-promise'))();

let currentTab = null;
const backupIntervol = 1000;
let globalHistory = [];
const historyPortTimeouts = {};


// Listen for new tabs coming online
chrome.runtime.onConnect.addListener(async function (port) {
  console.log(port);
  port.onMessage.addListener(messageHandler.bind(port));
  port.onDisconnect.addListener(port => {
    stopPortHistoryLoop(port.sender.tab.id);
  })
});

function stopPortHistoryLoop(tabId) {
  if (historyPortTimeouts[tabId]) {
    clearTimeout(historyPortTimeouts[tabId]);
    historyPortTimeouts[tabId] = null;
  }
}


/**
 * Should be bound with an open port
 * @param message
 * @return {Promise<void>}
 */
async function messageHandler(message) {
  console.log(message);
  if (message.action === 'ready') {
    this.postMessage({ action: 'init', history: globalHistory });
  } else if (message.action === 'initDone') {
    historyMessageDelay(this);
  } else if (message.action === 'historySent') {
    // Update it
    try {
      // await chromep.storage.sync.set({ history });
      globalHistory = message.history;
    } catch (err) {
      console.error(err);
    }

    historyMessageDelay(this);
  }
}

function historyMessageDelay(port) {
  // Initial history backup loop
  historyPortTimeouts[port.sender.tab.id] = setTimeout(() => {
    console.log('Recording history');
    // Fetch the history from the current tab
    port.postMessage({ action: 'sendHistory' });
  }, backupIntervol);
}

function activateTab(tab) {
  currentTab = tab;
  // Let the tab know we're ready to party
  chrome.tabs.sendMessage(tab.id, { action: 'activated' });
}


chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  console.log(`${tabId} activated`);

  const tab = await chromep.tabs.get(tabId);

  // let result = await chromep.storage.sync.get('history');
  if (currentTab) {
    // Pause the history collection in the background
    console.log(`Pausing tab ${currentTab.id}`);

    stopPortHistoryLoop(currentTab.id);
    try {
      chrome.tabs.sendMessage(currentTab.id, { action: 'pause' });
    } catch (err) {
      console.error(err);
    }

    // Update all the history items for the offset of the tab that's been clicked
    // (new index - current index) * window.clientWidth
    // const history = result.history;
    const offset = (currentTab.index - tab.index) * tab.width;
    console.log(`Shifting history items by ${offset}px.`);
    for (let item of globalHistory) {
      console.log(item);
      item.position.x += offset;
    }
    // Save it
    // await chromep.storage.sync.set({ history });
  }
  activateTab(tab);
});



// starting function
(async () => {
  const activeTabs = await chromep.tabs.query({ active: true });
  if (activeTabs) {
    activateTab(activeTabs[0]);
  }
})();
},{"chrome-promise":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY2hyb21lLXByb21pc2UvY2hyb21lLXByb21pc2UuanMiLCJzcmMvYmFja2dyb3VuZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG4gKiBjaHJvbWUtcHJvbWlzZVxuICogaHR0cHM6Ly9naXRodWIuY29tL3Rmb3h5L2Nocm9tZS1wcm9taXNlXG4gKlxuICogQ29weXJpZ2h0IDIwMTUgVG9tw6FzIEZveFxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKi9cblxuKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cbiAgICBkZWZpbmUoW10sIGZhY3RvcnkuYmluZChudWxsLCB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgPyB0aGlzIDogcm9vdCkpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgIC8vIE5vZGUuIERvZXMgbm90IHdvcmsgd2l0aCBzdHJpY3QgQ29tbW9uSlMsIGJ1dFxuICAgIC8vIG9ubHkgQ29tbW9uSlMtbGlrZSBlbnZpcm9ubWVudHMgdGhhdCBzdXBwb3J0IG1vZHVsZS5leHBvcnRzLFxuICAgIC8vIGxpa2UgTm9kZS5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkodGhpcyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gQnJvd3NlciBnbG9iYWxzIChyb290IGlzIHdpbmRvdylcbiAgICByb290LkNocm9tZVByb21pc2UgPSBmYWN0b3J5KHJvb3QpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uKHJvb3QpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICB2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UsXG4gICAgICBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbiAgLy8gVGVtcG9yYXJ5IGhhY2t5IGZpeCB0byBtYWtlIFR5cGVTY3JpcHQgYGltcG9ydGAgd29ya1xuICBDaHJvbWVQcm9taXNlLmRlZmF1bHQgPSBDaHJvbWVQcm9taXNlO1xuXG4gIHJldHVybiBDaHJvbWVQcm9taXNlO1xuXG4gIC8vLy8vLy8vLy8vLy8vLy9cblxuICBmdW5jdGlvbiBDaHJvbWVQcm9taXNlKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgY2hyb21lID0gb3B0aW9ucy5jaHJvbWUgfHwgcm9vdC5jaHJvbWU7XG4gICAgdmFyIFByb21pc2UgPSBvcHRpb25zLlByb21pc2UgfHwgcm9vdC5Qcm9taXNlO1xuICAgIHZhciBydW50aW1lID0gY2hyb21lLnJ1bnRpbWU7XG5cbiAgICBmaWxsUHJvcGVydGllcyhjaHJvbWUsIHRoaXMpO1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgZnVuY3Rpb24gc2V0UHJvbWlzZUZ1bmN0aW9uKGZuLCB0aGlzQXJnKSB7XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgIGFyZ3MucHVzaChjYWxsYmFjayk7XG5cbiAgICAgICAgICBmbi5hcHBseSh0aGlzQXJnLCBhcmdzKTtcblxuICAgICAgICAgIGZ1bmN0aW9uIGNhbGxiYWNrKCkge1xuICAgICAgICAgICAgdmFyIGVyciA9IHJ1bnRpbWUubGFzdEVycm9yO1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc3dpdGNoIChyZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0c1swXSk7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHRzKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgIH07XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaWxsUHJvcGVydGllcyhzb3VyY2UsIHRhcmdldCkge1xuICAgICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHtcbiAgICAgICAgICB2YXIgdmFsID0gc291cmNlW2tleV07XG4gICAgICAgICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsO1xuXG4gICAgICAgICAgaWYgKHR5cGUgPT09ICdvYmplY3QnICYmICEodmFsIGluc3RhbmNlb2YgQ2hyb21lUHJvbWlzZSkpIHtcbiAgICAgICAgICAgIHRhcmdldFtrZXldID0ge307XG4gICAgICAgICAgICBmaWxsUHJvcGVydGllcyh2YWwsIHRhcmdldFtrZXldKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRhcmdldFtrZXldID0gc2V0UHJvbWlzZUZ1bmN0aW9uKHZhbCwgc291cmNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSB2YWw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59KSk7XG4iLCIvKipcbiAqIGJhY2tncm91bmQuanNcbiAqIEluIGNoYXJnZSBvZjpcbiAqIC0gY29vcmRpbmF0aW5nIHRhYiBzdGF0ZXNcbiAqIC0gcmVjb3JkaW5nIGhpc3RvcnlcbiAqIC0gdXBkYXRpbmcgaGlzdG9yeSB3aGVuIGFjdGl2ZSB0YWIgY2hhbmdlc1xuICovXG5cbmNvbnN0IGNocm9tZXAgPSBuZXcgKHJlcXVpcmUoJ2Nocm9tZS1wcm9taXNlJykpKCk7XG5cbmxldCBjdXJyZW50VGFiID0gbnVsbDtcbmNvbnN0IGJhY2t1cEludGVydm9sID0gMTAwMDtcbmxldCBnbG9iYWxIaXN0b3J5ID0gW107XG5jb25zdCBoaXN0b3J5UG9ydFRpbWVvdXRzID0ge307XG5cblxuLy8gTGlzdGVuIGZvciBuZXcgdGFicyBjb21pbmcgb25saW5lXG5jaHJvbWUucnVudGltZS5vbkNvbm5lY3QuYWRkTGlzdGVuZXIoYXN5bmMgZnVuY3Rpb24gKHBvcnQpIHtcbiAgY29uc29sZS5sb2cocG9ydCk7XG4gIHBvcnQub25NZXNzYWdlLmFkZExpc3RlbmVyKG1lc3NhZ2VIYW5kbGVyLmJpbmQocG9ydCkpO1xuICBwb3J0Lm9uRGlzY29ubmVjdC5hZGRMaXN0ZW5lcihwb3J0ID0+IHtcbiAgICBzdG9wUG9ydEhpc3RvcnlMb29wKHBvcnQuc2VuZGVyLnRhYi5pZCk7XG4gIH0pXG59KTtcblxuZnVuY3Rpb24gc3RvcFBvcnRIaXN0b3J5TG9vcCh0YWJJZCkge1xuICBpZiAoaGlzdG9yeVBvcnRUaW1lb3V0c1t0YWJJZF0pIHtcbiAgICBjbGVhclRpbWVvdXQoaGlzdG9yeVBvcnRUaW1lb3V0c1t0YWJJZF0pO1xuICAgIGhpc3RvcnlQb3J0VGltZW91dHNbdGFiSWRdID0gbnVsbDtcbiAgfVxufVxuXG5cbi8qKlxuICogU2hvdWxkIGJlIGJvdW5kIHdpdGggYW4gb3BlbiBwb3J0XG4gKiBAcGFyYW0gbWVzc2FnZVxuICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAqL1xuYXN5bmMgZnVuY3Rpb24gbWVzc2FnZUhhbmRsZXIobWVzc2FnZSkge1xuICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgaWYgKG1lc3NhZ2UuYWN0aW9uID09PSAncmVhZHknKSB7XG4gICAgdGhpcy5wb3N0TWVzc2FnZSh7IGFjdGlvbjogJ2luaXQnLCBoaXN0b3J5OiBnbG9iYWxIaXN0b3J5IH0pO1xuICB9IGVsc2UgaWYgKG1lc3NhZ2UuYWN0aW9uID09PSAnaW5pdERvbmUnKSB7XG4gICAgaGlzdG9yeU1lc3NhZ2VEZWxheSh0aGlzKTtcbiAgfSBlbHNlIGlmIChtZXNzYWdlLmFjdGlvbiA9PT0gJ2hpc3RvcnlTZW50Jykge1xuICAgIC8vIFVwZGF0ZSBpdFxuICAgIHRyeSB7XG4gICAgICAvLyBhd2FpdCBjaHJvbWVwLnN0b3JhZ2Uuc3luYy5zZXQoeyBoaXN0b3J5IH0pO1xuICAgICAgZ2xvYmFsSGlzdG9yeSA9IG1lc3NhZ2UuaGlzdG9yeTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9XG5cbiAgICBoaXN0b3J5TWVzc2FnZURlbGF5KHRoaXMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhpc3RvcnlNZXNzYWdlRGVsYXkocG9ydCkge1xuICAvLyBJbml0aWFsIGhpc3RvcnkgYmFja3VwIGxvb3BcbiAgaGlzdG9yeVBvcnRUaW1lb3V0c1twb3J0LnNlbmRlci50YWIuaWRdID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ1JlY29yZGluZyBoaXN0b3J5Jyk7XG4gICAgLy8gRmV0Y2ggdGhlIGhpc3RvcnkgZnJvbSB0aGUgY3VycmVudCB0YWJcbiAgICBwb3J0LnBvc3RNZXNzYWdlKHsgYWN0aW9uOiAnc2VuZEhpc3RvcnknIH0pO1xuICB9LCBiYWNrdXBJbnRlcnZvbCk7XG59XG5cbmZ1bmN0aW9uIGFjdGl2YXRlVGFiKHRhYikge1xuICBjdXJyZW50VGFiID0gdGFiO1xuICAvLyBMZXQgdGhlIHRhYiBrbm93IHdlJ3JlIHJlYWR5IHRvIHBhcnR5XG4gIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKHRhYi5pZCwgeyBhY3Rpb246ICdhY3RpdmF0ZWQnIH0pO1xufVxuXG5cbmNocm9tZS50YWJzLm9uQWN0aXZhdGVkLmFkZExpc3RlbmVyKGFzeW5jICh7IHRhYklkLCB3aW5kb3dJZCB9KSA9PiB7XG4gIGNvbnNvbGUubG9nKGAke3RhYklkfSBhY3RpdmF0ZWRgKTtcblxuICBjb25zdCB0YWIgPSBhd2FpdCBjaHJvbWVwLnRhYnMuZ2V0KHRhYklkKTtcblxuICAvLyBsZXQgcmVzdWx0ID0gYXdhaXQgY2hyb21lcC5zdG9yYWdlLnN5bmMuZ2V0KCdoaXN0b3J5Jyk7XG4gIGlmIChjdXJyZW50VGFiKSB7XG4gICAgLy8gUGF1c2UgdGhlIGhpc3RvcnkgY29sbGVjdGlvbiBpbiB0aGUgYmFja2dyb3VuZFxuICAgIGNvbnNvbGUubG9nKGBQYXVzaW5nIHRhYiAke2N1cnJlbnRUYWIuaWR9YCk7XG5cbiAgICBzdG9wUG9ydEhpc3RvcnlMb29wKGN1cnJlbnRUYWIuaWQpO1xuICAgIHRyeSB7XG4gICAgICBjaHJvbWUudGFicy5zZW5kTWVzc2FnZShjdXJyZW50VGFiLmlkLCB7IGFjdGlvbjogJ3BhdXNlJyB9KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgYWxsIHRoZSBoaXN0b3J5IGl0ZW1zIGZvciB0aGUgb2Zmc2V0IG9mIHRoZSB0YWIgdGhhdCdzIGJlZW4gY2xpY2tlZFxuICAgIC8vIChuZXcgaW5kZXggLSBjdXJyZW50IGluZGV4KSAqIHdpbmRvdy5jbGllbnRXaWR0aFxuICAgIC8vIGNvbnN0IGhpc3RvcnkgPSByZXN1bHQuaGlzdG9yeTtcbiAgICBjb25zdCBvZmZzZXQgPSAoY3VycmVudFRhYi5pbmRleCAtIHRhYi5pbmRleCkgKiB0YWIud2lkdGg7XG4gICAgY29uc29sZS5sb2coYFNoaWZ0aW5nIGhpc3RvcnkgaXRlbXMgYnkgJHtvZmZzZXR9cHguYCk7XG4gICAgZm9yIChsZXQgaXRlbSBvZiBnbG9iYWxIaXN0b3J5KSB7XG4gICAgICBjb25zb2xlLmxvZyhpdGVtKTtcbiAgICAgIGl0ZW0ucG9zaXRpb24ueCArPSBvZmZzZXQ7XG4gICAgfVxuICAgIC8vIFNhdmUgaXRcbiAgICAvLyBhd2FpdCBjaHJvbWVwLnN0b3JhZ2Uuc3luYy5zZXQoeyBoaXN0b3J5IH0pO1xuICB9XG4gIGFjdGl2YXRlVGFiKHRhYik7XG59KTtcblxuXG5cbi8vIHN0YXJ0aW5nIGZ1bmN0aW9uXG4oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBhY3RpdmVUYWJzID0gYXdhaXQgY2hyb21lcC50YWJzLnF1ZXJ5KHsgYWN0aXZlOiB0cnVlIH0pO1xuICBpZiAoYWN0aXZlVGFicykge1xuICAgIGFjdGl2YXRlVGFiKGFjdGl2ZVRhYnNbMF0pO1xuICB9XG59KSgpOyJdfQ==
