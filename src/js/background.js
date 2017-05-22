// Author: Daniel G (oscar-daniel.gonzalez@hp.com)

console.log("Loading Tridion Extension background");

/*
 * Listen to load of Tridion Dashboard and inject the extension
 */
chrome.webNavigation.onCompleted.addListener(
  tab =>
  {
    console.debug('Loading Tridion Extension');

    var details = {runAt: "document_end"};
    details["file"] = "js/popup.js";
    // chrome.tabs.executeScript( tab.tabId, details, msg_log("injected tridion_ext.js"));
  }
  // URL filter
  , {url:[{pathContains:"ListFilters/SearchListBar.aspx"}]}		
);

/*
 * Listen to load of levels to fill options page
 */
chrome.webNavigation.onCompleted.addListener(
  tab => chrome.tabs.sendMessage(tab.tabId, "init_levels"),
  {url:[{pathContains:"SplashScreen/SplashScreen.aspx"}]}
);

// ALL REQUESTS
chrome.webRequest.onCompleted.addListener(
  tab =>
  {
    // console.info("REQUEST-------------------------")
    // console.log("URL:", tab);
  },
  {urls: ["<all_urls>"]}
);

// ALL NAVIGATION
chrome.webNavigation.onCompleted.addListener(
  tab =>
  {
    // console.info("NAVIGATION-------------------------")
    // console.log("URL:", tab);
  },
  {urls: ["<all_urls>"]}
);

/*
 *	Click listener for extension button
 */
chrome.browserAction.onClicked.addListener(function(tab) {
  // No tabs or host permissions needed!
  console.log('browserAction');
  // chrome.tabs.executeScript({
  // 	code: 'document.body.style.backgroundColor="red"'
  // });
});

/*
 * Handle messages from page
 */
chrome.runtime.onMessage.addListener(function(msg)
{
  console.debug("Background - Yo I got a message!");
  console.info(msg);

  switch (msg.action) {
    case 'init_levels':
      chrome.storage.local.get("main_batch", obj =>{
        if(obj.main_batch == undefined){
          var json = {
            'main_batch': {
              "levels": msg.data, 
              "config": []
            }
          };

          chrome.storage.local.set(json, () => {
            console.log('Settings saved');
          });
        }
        console.log("Levels already defined");
      })
      break;
    case 'open_item':
      chrome.tabs.create({ url: msg.url, active: false});
      break;
    default:
      break;
  }	
});

// UTILS
function msg_log(str)
{
    console.info(str);
}