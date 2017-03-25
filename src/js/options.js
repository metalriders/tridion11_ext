// Saves options to chrome.storage
function save_options() {
  chrome.storage.sync.set({
    // values to save
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    // values to load
  }, function(items) {
    // TODO
  });
}

class OptionLevel extends HTMLElement{
  constructor(level){
    super();
    
    var chkbx = document.createElement("input");
    var span = document.createElement("span");
    this.id = level.id;
    chkbx.type = "checkbox";
    chkbx.id = level.id;
    span.textContent = level.name;
    this.append(chkbx);
    this.append(span);
    return this;
  }
}
customElements.define('option-level', OptionLevel);

class OptionLevels extends HTMLElement{

  addOption(level){
    this.append(new OptionLevel(level));
  }
  
  constructor(levels){
    super();
    levels.forEach(this.addOption, this);
    return this;
  }
}
customElements.define('option-levels', OptionLevels);

class OptionsSection extends HTMLElement{
  constructor(){
    super();
    if(this.getAttribute("custom")){
      this.custom = true;
    }
    if(this.hasAttribute("name")){
      var title = document.createElement("h2");
      title.textContent = this.getAttribute("name");
      this.append(title);
    }
    this.append(new OptionLevels([{name:"H", id:12},{name:"H", id:12},{name:"H", id:12},{name:"H", id:12},{name:"H", id:12},{name:"H", id:12},{name:"H", id:12},{name:"H", id:12},{name:"H", id:12}]));
  }
}
customElements.define('option-section', OptionsSection);