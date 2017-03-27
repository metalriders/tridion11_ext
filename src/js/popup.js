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
scr.src= chrome.extension.getURL('js/tridion_ext.js');;
document.head.appendChild(scr);

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.action && (event.data.action == "open_item" || event.data.action == "init_levels"))    chrome.runtime.sendMessage(event.data);

}, false);