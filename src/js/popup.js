// Author: Daniel G (oscar-daniel.gonzalez@hp.com)

// Reserved for comms
chrome.runtime.onMessage.addListener(function(msg)
{
  alert("Popup - Yo I got a message!");
  console.debug(msg);
});

// Inject tridion_ext into page
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

function get_publishable_batches(){
  // Get all publishable batches
  console.debug("gettin publishable batches!");
  chrome.storage.local.get(null,(storage)=>{
    if(!storage.cust_batches) return;

    var publishable_batches = [];
    storage.cust_batches.forEach((cust_batch)=>{
      if(cust_batch.publishable) publishable_batches.push(cust_batch);
    });
    window.postMessage({"action":"publishable_batches", "data": publishable_batches},"*");
  })
}