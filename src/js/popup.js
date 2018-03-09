/**
 * Construct elements used in options page and provide
 * functionality to edit custom batches used for extension.
 */

var chrome_storage = chrome.storage;
var chrome_storage_local = chrome_storage.local;
var chrome_storage_sync = chrome_storage.sync;

// Reserved for communications from bkg
chrome.runtime.onMessage.addListener(function(msg)
{
  console.debug('POPUP MSG from BKG - ', msg);
  switch(msg){
    default: break;
  }
});

function injectElement(element, type, source){
  console.log("Injecting %s : %s", type, source);
  let el = document.createElement(element);
  el.type = type;
  el.src = source;
  document.head.appendChild(el);
}

// inject scripts
injectElement('script', 'text/javascript', chrome.extension.getURL('js/utils.js'));
injectElement('script', 'text/javascript', chrome.extension.getURL('js/modules/dashboard_classes.js'));
injectElement('script', 'text/javascript', chrome.extension.getURL('js/modules/custom_queue.js'));
setTimeout( () => injectElement('script', 'text/javascript', chrome.extension.getURL('js/tridion_ext.js')), 5000);

// Reserved for communications from tridion page
window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  switch(event.data.action){
    case "open_item" :
      chrome.runtime.sendMessage(event.data);
      break;
    case "init_levels":
      let dashboard = document.querySelector("#DashboardTree iframe");
      let publications_ref = dashboard.contentDocument.querySelectorAll("div.rootNode.populated > div.children.visible > div.node");
      var levels = {};
      
      // console.log("Getting levels");
      publications_ref.forEach(
        publication_el => 
        {
          var id = publication_el.id.split(':')[1].split('-')[1];
          var level = publication_el.querySelector(".header .title").title;
          level = level.replace(/ \(tcm.*\)/g, "");  // lvl   remove what is between parenthesis
          levels[unescape(level)] = id;
        });

      // console.log("List of formated levels", levels);
      // Set levels in storage
      chrome.runtime.sendMessage({action: "init_levels_storage", data: levels});
      // Set levels in TridionExt instance
      window.postMessage({"action":"set_levels", "data": levels},"*");
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
  chrome_storage_local.get(null, storage =>{
    if(!storage.custom_batches) return;

    var publishable_batches = [];
    storage.custom_batches.forEach( custom_batch =>{
      if(custom_batch.publishable) publishable_batches.push(custom_batch);
    });
    window.postMessage({"action":"publishable_batches", "data": publishable_batches},"*");
  })
}