// Author: Daniel G (oscar-daniel.gonzalez@hp.com)

console.log("Loading Tridion Extension");
/*
	Listen to load of Tridion Dashboard and inject the extension
*/
chrome.webNavigation.onCompleted.addListener(
	function(tab)
	{
		console.debug('Loading Tridion Extension');

		var details = {runAt: "document_end"};
		details["file"] = "popup.js";
		chrome.tabs.executeScript( tab.tabId, details, msg_log("loaded tridion_ext"));
	}
	// URLfilter
	, {url:[{pathContains:"ListFilters/SearchListBar.aspx"}]}		
);

/*
	Click listener for extension button
*/
chrome.browserAction.onClicked.addListener(function(tab) {
	// No tabs or host permissions needed!
	console.log('browserAction');
	chrome.tabs.executeScript({
		code: 'document.body.style.backgroundColor="red"'
	});
});

/*
	Handle messages from page
*/
chrome.runtime.onMessage.addListener(function(msg)
{
	console.debug("Background - Yo I got a message!");
	console.info(msg);
	chrome.tabs.create({ url: msg.url, active: false});
});

// UTILS
function msg_log(str)
{
  	console.info(str);
}