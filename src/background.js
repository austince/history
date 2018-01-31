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
