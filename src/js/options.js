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
    chkbx.type = "checkbox";
    chkbx.id = level.id;
    chkbx.value = level.name;
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
    for(var level in levels) 
      this.addOption({name:level, id:levels[level]});
    return this;
  }
}
customElements.define('option-levels', OptionLevels);

class OptionsSection extends HTMLElement{
  constructor(name, custom){
    super();
    
    var title = document.createElement("h2");
    title.textContent = this.getAttribute("name") || name || "Custom batch";
    this.append(title);  

    if(custom) {
      this.custom = true;
      var selected_levels = {};
      document.querySelectorAll("#main-section input:checked").forEach(function(input){
        selected_levels[input.value] = input.id;
      });
      this.appendChild(new OptionLevels(selected_levels));
    }  
  }
}
customElements.define('option-section', OptionsSection);


(function(){

  var customs = document.querySelector("#custom-sections");
  // Load personal settings
  chrome.storage.local.get("all_levels", function(levels){
    if(levels == undefined) return;
    console.log("loading levels");
    var all_lvl_container = document.querySelector("option-section");
    var levels = new OptionLevels(levels.all_levels);
    
    
    // input change listeners
    levels.querySelectorAll("input").forEach(function(input) {
      input.addEventListener("change", function () {
        var id =input.id;
        var added = false;
        
        if(this.checked)
          document.querySelectorAll("#custom-sections option-levels").forEach(function(levels){

            levels.querySelectorAll("input").forEach(function(section_input){
              if(section_input.value > input.value && !added){
                levels.inserBefore(new OptionLevel({id:input.id, name:input.value}), section_input.parentNode)
                added = true;
              }
            });

            if(!added) levels.appendChild( new OptionLevel({id:input.id, name:input.value}));
          });
        else
          document.querySelector('#custom-sections input[id="'+input.id+'"]').parentNode.remove();
      })
    },this);

    all_lvl_container.appendChild(levels);
  });

  document.querySelector(".add_custom").addEventListener("click", function(){
    customs.appendChild(new OptionsSection("New Batch", true));
  });

})();