console.log("Loading Tridion Extension");

var callback;
var filters =
{
	url: 
	[
		//{hostSuffix:"epocms.www8.hp.com"}
		{pathContains:"ListFilters/SearchListBar.aspx"}
	]
};

// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
// 	chrome.tabs.executeScript(tab.tabId, {"code":'console.log("hello world from the other side")'}, function (){
// 		console.log("Executed Script 2");
// 	});
// }); 

// UTILS
function msg_log(str)
{
	console.info(str);
}


/*
	Listen to load of Tridion Dashboard and inject the extension
*/
callback = function(tab) {
	var details;
	console.debug('Loading Tridion Extension');

	details = {file:"jquery_3.min.js", runAt: "document_end"};
	chrome.tabs.executeScript( tab.tabId, details, msg_log("loaded jquery_3"));

	details = {file:"popup.js", runAt:"document_end"};
	chrome.tabs.executeScript( tab.tabId, details, msg_log("loaded tridion_ext"));

	chrome.tabs.sendMessage(tab.tabId, {"action": "dashboard_load"}, function (){
		console.debug("Finished load of tridion!");
	});
}
chrome.webNavigation.onCompleted.addListener(callback, filters);

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
callback = null;