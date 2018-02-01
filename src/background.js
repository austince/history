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