/**
 * Convert any string from unicode to ascii values
 * 
 * @param {any} string 
 * @returns {out} converted string
 */
function unicodeToASCII(str)
{
  var out = '';
  for (var i = 0; i < str.length; i++) {
      out += String.fromCharCode(str.charCodeAt(i) % 128);
  }
  return out;
}

/**
 * Wrapper for observers
 * 
 * @param {any} target 
 * @param {any} config 
 * @param {any} callback 
 */
function observerWrapper(target, config, callback)
{
  var observer = new MutationObserver(callback);
  observer.observe(target, config);
  // observer.disconnect();
}

/**
 * Emulate multiple selection
 * 
 * @param {any} element 
 * @param {any} first_selection 
 */
function multipleSelector(element, first_selection)
{
  var evt = new MouseEvent('mousedown', {
    bubbles: true,
    ctrlKey: !first_selection
  });
  element.dispatchEvent(evt);
}

/**
 * Emulate left mouse click
 * 
 * @param {any} element 
 */
function leftClick(element, bubbles, cancelable) {
  var evt = new MouseEvent('click', {
    bubbles: bubbles || true,
    cancelable: cancelable || false,
    view: window
  });
  element.dispatchEvent(evt);
}

/**
 * Emulate right mouse click
 * 
 * @param {any} element 
 */
function rightClick(element, bubbles, cancelable) {
  var evt = new MouseEvent('contextmenu', {
    bubbles: bubbles || true,
    cancelable: cancelable || false,
    view: window
  });
  element.dispatchEvent(evt);
}