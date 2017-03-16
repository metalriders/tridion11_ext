console.log("Loading Tridion Extension");

var filters =
{
	url: 
	[
		{hostSuffix:"epocms.www8.hp.com"},
		{pathSuffix:"TridionDashboard.aspx"}
	]
};

// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
// 	chrome.tabs.executeScript(tab.tabId, {"code":'console.log("hello world from the other side")'}, function (){
// 		console.log("Executed Script 2");
// 	});
// }); 

chrome.webNavigation.onCompleted.addListener(function(tab) {
	console.debug('webNavigation completed');
  	console.log(tab);
	
	// chrome.tabs.executeScript(tab.tabId, {"file":'popup.js'}, function (){
	// 	console.debug("Executed Script");
	// });


	var hey = "hola";

	chrome.tabs.sendMessage(tab.tabId, {"var": hey}, function (){
		console.debug("Sent Message");
	});

}, filters);


//GetList to update List of items

chrome.browserAction.onClicked.addListener(function(tab) {
  // No tabs or host permissions needed!
  console.log('browserAction');
  chrome.tabs.executeScript({
    code: 'document.body.style.backgroundColor="red"'
  });
});
