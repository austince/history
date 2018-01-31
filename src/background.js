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
