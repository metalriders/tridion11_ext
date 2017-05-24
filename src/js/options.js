/**
 * Construct elements used in options page and provide
 * functionality to edit custom batches used for extension.
 */
 
var chrome_storage = chrome.storage;
var chrome_storage_local = chrome_storage.local;
var chrome_storage_sync = chrome_storage.sync;

// Restores select box and checkbox state using the preferences
// stored in chrome_storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome_storage_sync
    .get({
      // values to load
    }, (items) => {
      // TODO
    });
}

class OptionLevel extends HTMLElement
{
  constructor(level, checked=false)
  {
    super();
    
    let checkbox = document.createElement("input");
    let span = document.createElement("span");

    checkbox.type = "checkbox";
    checkbox.id = level.id;
    checkbox.value = level.name;
    checkbox.checked = checked;
    span.textContent = level.name;

    this.append(checkbox);
    this.append(span);
    
    return this;
  }
}
customElements.define('option-level', OptionLevel);

class OptionLevels extends HTMLElement
{
  constructor(levels)
  {
    super();
    for(var level in levels) this.addOption({name:level, id:levels[level]});
    return this;
  }
  addOption(level)
  {
    this.append(new OptionLevel(level));
  }
}
customElements.define('option-levels', OptionLevels);

class OptionsSection extends HTMLElement
{
  constructor(name, custom, id)
  {
    super();

    var title_container = document.createElement("div");
    title_container.className = "title_container";
    
    var title = document.createElement("h2");
    title.textContent = this.getAttribute("name") || name || "Custom batch";
    title_container.append(title);
    this.append(title_container);

    if(custom) 
    {
      this.id = id? id : new Date().valueOf();
      this.custom = true;
      let selected_levels = {};
      
      title.addEventListener(
        "dblclick",
        ()=> console.log("double click!")
      );
      document.querySelectorAll("#main-section input:checked")
        .forEach( (input) => selected_levels[input.value] = input.id);

      let title_input = document.createElement("input");
      title_container.appendChild(title_input);
      title_input.style.display = "none";

      title_input.addEventListener(
        "keydown",
        e =>
        {
          if(e.keyCode == 13)
          {
            title.textContent = title_input.value;
            title_input.style.display = "none";
          }
        }
      );

      let edit = document.createElement("span");
      edit.className = "edit";
      edit.addEventListener(
        "click", 
        ()=>
        {
          title_input.style.display = "block";
          title_input.value = title.textContent;
          title.textContent = "";
          title_input.focus();
        }
      );

      let del = document.createElement("button");
      del.className = "delete";
      del.textContent = "x";
      del.addEventListener(
        "click",
        () => 
        {
          if( confirm("Are you sure you want to delete this batch?"))
            del.parentNode.remove();
        }
      );
      let opt_levels = new OptionLevels(selected_levels);
      $(title).click( () =>
      {
        $(opt_levels).toggle();
      });

      this.appendChild(edit);
      this.appendChild(del);
      this.appendChild(opt_levels);
    }
  }
}
customElements.define('option-section', OptionsSection);


(function(){

  var main_levels;
  var main_conf;
  var custom_batches;

  /**
   * Save options to chrome local storage.
   * This will save your selected main batch levels and update custom batches.
   */
  function save_options() {    
    var options = {
      "main_batch":{
        "levels" : main_levels, 
        "conf":{}
      },
      "custom_batches": []
    };

    // Get main_batch changes
    document.querySelectorAll("#main-section input:checked")
      .forEach( (item) => options.main_batch.conf[item.value] = true );

    // Get custom batches
    document.querySelectorAll("#custom-sections option-section")
      .forEach( section =>
      {
        var publishable = true;
        var section_conf = 
        {
          "id": section.id,
          "name": section.querySelector("h2").textContent,
          "conf": [],
          "publishable": true
        };

        section.querySelectorAll("input:checked")
          .forEach( item =>
          {
            if(!item.value.match(/17/) && publishable) publishable = !publishable;
            section_conf.conf.push(item.id);
          });

        section_conf.publishable = publishable;
        options.custom_batches.push(section_conf);
      });

    // Set new options and let user know options were saved.
    chrome_storage_local
      .set(options, ()=>
      {
        let status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout( () => status.textContent = '', 750);
      });
  }

  var customs = document.querySelector("#custom-sections");
  // Load personal settings
  chrome_storage_local
    .get( null, 
      conf => 
      {
        if(conf.main_batch == undefined || conf.main_batch.levels == undefined) 
        { 
          alert("No main batch found, run tridion first"); 
          return; 
        }
      
        console.log("loading levels");
        main_levels = conf.main_batch.levels;
        main_conf = conf.main_batch.conf;
        custom_batches = conf.custom_batches;
      
        
        let all_levels_container = document.querySelector("option-section");
        var levels = new OptionLevels(main_levels);
  
        // Load Main batch
        levels.querySelectorAll("input")
          .forEach( level => 
          {
            if(main_conf != undefined) level.checked = main_conf[level.value];

            level.addEventListener("change", ()=> 
            {
              var id = level.id;
              
              if(level.checked)
              {
                document.querySelectorAll("#custom-sections option-levels")
                  .forEach(levels =>
                  {
                    let added = false;
                    levels.querySelectorAll("input")
                      .forEach( section_level =>
                      {
                        if(section_level.value > level.value && !added){
                          section_level
                            .parentNode
                            .insertAdjacentElement(
                              'beforebegin', 
                              new OptionLevel({id:level.id, name:level.value})
                            );
                          added = true;
                        }
                      });

                      if(!added) 
                        levels
                          .appendChild( 
                            new OptionLevel({id:level.id, name:level.value})
                          );
                  });
              }
              else
                document.querySelectorAll(`#custom-sections input[id="${level.id}"]`)
                  .forEach( input => input.parentNode.remove() );
            });
          }
          ,this);
          
        all_levels_container.appendChild(levels);
        
        $(all_levels_container).find("h2").click( ()=> $(levels).toggle() );
        if(custom_batches) $(all_levels_container).find("h2").click();
        
        if(custom_batches == undefined){
          console.error("No custom batch found, create one first"); 
          return; 
        }

        // Load custom batches
        let custom_batches_container = document.querySelector("#custom-sections");
        custom_batches.forEach(section =>
        {
          var custom_batch = new OptionsSection(section.name, true, section.id);
          
          // turn on selected items
          section.conf.forEach(
            level => custom_batch.querySelector(`[id="${level}"]`).checked = true);

          custom_batches_container.appendChild(custom_batch);
        })
     });

  document.querySelector(".add_custom")
    .addEventListener(
      "click",
      () => customs.appendChild(new OptionsSection("New Batch", true))
    );

  document.querySelector("#save").addEventListener("click", save_options);
})();