// Author: Daniel G (oscar-daniel.gonzalez@hp.com)

// Reserved for comms
chrome.runtime.onMessage.addListener(function(msg)
{
  console.info("Yo I got a message!");
  console.debug(msg);
});

// Inject tridion_ext into page
var scr = document.createElement('script');
scr.type="text/javascript";
scr.src= chrome.extension.getURL('tridion_ext.js');;
document.head.appendChild(scr);