console.log("Loading Tridion Extension");



/*
	Listen to load of Tridion Dashboard and inject the extension
*/
chrome.webNavigation.onCompleted.addListener(
	function(tab)
	{
		var details = {runAt: "document_end"};
		console.debug('Loading Tridion Extension');

		details["file"] = "jquery_3.min.js";
		chrome.tabs.executeScript( tab.tabId, details, msg_log("loaded jquery_3"));

		details["file"] = "popup.js";
		chrome.tabs.executeScript( tab.tabId, details, msg_log("loaded tridion_ext"));

		chrome.tabs.sendMessage(tab.tabId, {"action": "dashboard_load"}, function (){
			console.debug("Finished load of tridion!");
		});
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

// UTILS
function msg_log(str)
{
	console.info(str);
}