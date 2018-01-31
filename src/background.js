// sit in the background, waiting for the extension button to be clicked...
chrome.browserAction.onClicked.addListener( function(tab) {

	// ...when it's clicked, run the extension on the current tab
	// chrome.tabs.executeScript( tab.id, {file: "bundle.js"} );
  // Update all the history items for the offset of the tab that's been clicked
  // (new index - current index) * window.clientWidth
  chrome.storage.sync.get('', () => {

  })
});
