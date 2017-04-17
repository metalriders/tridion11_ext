
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
  constructor(level, checked=false){
    super();
    
    var chkbx = document.createElement("input");
    var span = document.createElement("span");
    chkbx.type = "checkbox";
    chkbx.id = level.id;
    chkbx.value = level.name;
    chkbx.checked = checked;
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
  constructor(name, custom, id){
    super();
    
    var title = document.createElement("h2");
    title.textContent = this.getAttribute("name") || name || "Custom batch";
    this.append(title);  

    if(custom) {
      this.id = id? id : new Date().valueOf();
      this.custom = true;
      var selected_levels = {};
      document.querySelectorAll("#main-section input:checked").forEach(function(input){
        selected_levels[input.value] = input.id;
      });
      var del = document.createElement("button");
      del.className = "delete";
      del.textContent = "x";
      del.addEventListener("click", function(){this.parentNode.remove();});

      var opt_levels = new OptionLevels(selected_levels);
      $(title).click(function(){ $(opt_levels).toggle();});
      this.appendChild(del);
      this.appendChild(opt_levels);

    }  
  }
}
customElements.define('option-section', OptionsSection);


(function(){

  var ls_main_levels;
  var ls_main_conf;
  var ls_cust_batches;

  // Saves options to chrome.storage
  function save_options() {
    console.debug('saving options');
    
    var options = {
      "main_batch":{
        "levels" : ls_main_levels, 
        "conf":{}
      },
      "cust_batches": []
    };

    // Get main_batch changes
    document.querySelectorAll("#main-section input:checked").forEach(function(item){options.main_batch.conf[item.value] = true;});

    // Get custom batches
    document.querySelectorAll("#custom-sections option-section").forEach(function(section){
      var publishable = true;
      var section_conf = {
        "id": section.id,
        "name": section.querySelector("h2").textContent,
        "conf": [],
        "publishable": true
      };
      section.querySelectorAll("input:checked").forEach(function(item){
        if(!item.value.match(/17/) && publishable) publishable = !publishable;
        section_conf.conf.push(item.id);
      });
      section_conf.publishable = publishable;

      options.cust_batches.push(section_conf);
    });

    chrome.storage.local.set(options, function() {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 750);
    });
  }
  var customs = document.querySelector("#custom-sections");
  // Load personal settings
  chrome.storage.local.get(null, function(conf){
    
    if(conf.main_batch.levels == undefined) 
    { 
      console.error("No main batch found, run tridion first"); 
      return; 
    }
    
    console.log("loading levels");
    ls_main_levels = conf.main_batch.levels;
    ls_main_conf = conf.main_batch.conf;
    ls_cust_batches = conf.cust_batches;
    
    // Load Main batch
    var all_lvl_container = document.querySelector("option-section");
    var levels = new OptionLevels(ls_main_levels);
    levels.querySelectorAll("input").forEach(function(input) {
      if(ls_main_conf != undefined) input.checked = ls_main_conf[input.value];

      // main level change listeners
      input.addEventListener("change", function () {
        var id =input.id;
        
        if(this.checked)
          document.querySelectorAll("#custom-sections option-levels").forEach(function(levels){
            var added = false;
            levels.querySelectorAll("input").forEach(function(section_input){
              if(section_input.value > input.value && !added){
                section_input.parentNode.insertAdjacentElement('beforebegin', new OptionLevel({id:input.id, name:input.value}))
                added = true;
              }
            });

            if(!added) levels.appendChild( new OptionLevel({id:input.id, name:input.value}));
          });
        else
          document.querySelectorAll('#custom-sections input[id="'+input.id+'"]').forEach(function(input){
            input.parentNode.remove();
          });
      })
    },this);
    all_lvl_container.appendChild(levels);
    $(all_lvl_container).find("h2").click(function(){$(levels).toggle();});
    $(all_lvl_container).find("h2").click();
    
    if(ls_cust_batches == undefined){
      console.error("No custom batch found, create one first"); 
      return; 
    }
    // Load custom batches
    var cust_container = document.querySelector("#custom-sections");
    ls_cust_batches.forEach(function(section){
      var cust_section = new OptionsSection(section.name, true, section.id);
      
      // turn on selected items
      section.conf.forEach(function(level){
        cust_section.querySelector('[id="'+level+'"]').checked = true;
      });

      cust_container.appendChild(cust_section);
    })
  });

  document.querySelector(".add_custom").addEventListener("click", function(){
    customs.appendChild(new OptionsSection("New Batch", true));
  });

  document.querySelector("#save").addEventListener("click", save_options);

})();