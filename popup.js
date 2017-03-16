// Author: Daniel G (oscar-daniel.gonzalez@hp.com)

chrome.runtime.onMessage.addListener(function(message)
{
  console.info("Yo I got a message!");
  console.debug(message);
  
  switch(message)
  {
    case "list": 
      break;
    default: 
      break;
  }
});

document.onreadystatechange = function () {
  if (document.readyState === "complete") {
    new Tridion_Ext(); 
  }
}