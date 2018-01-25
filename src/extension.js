const $ = require('jquery');

/**
 * Each history obj needs html to display, x y position, and time saved
 * They should be positioned by their place in the array
 * Oldest at the head
 * 
 */

/*
 * interface HistoryItem {
 * 	html: string;
 * 	position: [number, number];
 * 	timeSaved: Date;
 * }
 */


(function () {
	console.log('ext')
	console.log(chrome);
	const history = [];

	// Start mouse watcher
	let mouseX, mouseY;
	$(document).mousemove((event) => {
		mouseX = event.pageX;
		mouseY = event.pageY;
	});
	function closestMouseElement() {
		return document.elementFromPoint(mouseX, mouseY);
	}


	function addToHistoryLoop() {
		const el = closestMouseElement();
		history.push(el);
		setTimeout(addToHistoryLoop, 1000);
	}
	addToHistoryLoop();

})();
