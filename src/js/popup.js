/**
 * Construct elements used in options page and provide
 * functionality to edit custom batches used for extension.
 */

var chrome_storage = chrome.storage;
var chrome_storage_local = chrome_storage.local;
var chrome_storage_sync = chrome_storage.sync;

// Reserved for communications
chrome.runtime.onMessage.addListener(function(msg)
{
  alert("Popup - Yo I got a message!");
  console.debug(msg);
});

// Inject tridion_ext into page
console.log("Injecting tridion extension");
var scr = document.createElement('script');
scr.type="text/javascript";
scr.src= chrome.extension.getURL('js/tridion_ext.js');
document.head.appendChild(scr);

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  switch(event.data.action){
    case "open_item" :
    case "init_levels":
      chrome.runtime.sendMessage(event.data);
      break;
    case "get_publishable_batches":
      get_publishable_batches();
    default:
      break;
  }  
}, false);

/**
 * Get batches filtered by its availability to be
 * published with Tridion
 */
function get_publishable_batches(){
  // Get all publishable batches
  console.debug("getting publishable batches!");
  chrome_storage_local.get(null, storage =>{
    if(!storage.custom_batches) return;

    var publishable_batches = [];
    storage.custom_batches.forEach( custom_batch =>{
      if(custom_batch.publishable) publishable_batches.push(custom_batch);
    });
    window.postMessage({"action":"publishable_batches", "data": publishable_batches},"*");
  })
}

(()=>{
  var dashboard_tree = document.querySelector("#DashboardTree");
  // listen for a change on dashboard
  console.debug("Got dashboard");
  dashboard_tree.onload = ()=>{
    let dashboard_doc = dashboard_tree.contentDocument;
    let dom_selector = "div.rootNode.populated > div.children.visible > div.node";
    let publications_refs = dashboard_doc.querySelectorAll(dom_selector);
    var levels = [];

    publications_refs.forEach(
      publication =>
      {
        let id = publication.id.split(':')[1].split('-')[1];
        let lvl = publication.querySelector(".header .title").title;
        lvl = lvl.replace(/ \(tcm.*\)/g, "");
        levels[unescape(lvl)] = id;
      }
    );
    chrome.runtime.sendMessage({action: "init_levels", data: levels});
  };
})();