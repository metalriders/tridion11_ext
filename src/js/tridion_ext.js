var features = 
{
  open_items: 
  {
    id: "open_mult_items",
    class:"item Open", 
    title: "Open selected items"
  },
  custom_queue:{
    id: "add_to_cust_queue",
    class:"item Publish",
    title: "Push to Custom Queue"
  },
  publish_items:
  {
    id: "publihs_mult_items",
    class:"item Publish disabled", 
    title: "Publish from custom Queue"
  }
};

class DashboardMenuFeature
{
  constructor(feature, listeners)
  {
    var _self = this;
    this.element = document.createElement("li");
    this.element.className  = feature.class;
    this.element.id = feature.id;

    var element_div = document.createElement("div");
    element_div.className = "image";
    element_div.setAttribute("unselectable", "on");

    var element_span = document.createElement("span");
    element_span.innerHTML = feature.title;
    
    this.element.appendChild(element_div);
    this.element.appendChild(element_span);
    
    this.element.addEventListener(
      "mouseover",
      ()=> Tridion.Controls.ContextMenu.prototype._hightlightItem(this.element)
    );
    this.element.addEventListener(
      "click",
      ()=> this.element.parentElement.style.visibility = "hidden"
    );

    listeners.forEach(
      listener => _self.element.addEventListener(listener.type, listener.callback)
    );

    return this.element;
  }
}

/**
 * 
 * Instant instantiation
 * @class Tridion_Ext
 */
new class Tridion_Ext
{  
  constructor()
  {
    this._v = '0.0.8';

    // Context UI
    this.dashboard = document.querySelector(".dashboard");
    this.dashboard_menu = document.querySelector("#DashboardContextMenu");
    this.dashboard_list = document.querySelector("#FilteredDashboardList");
    this.publish_group = document.querySelector("#PublishGroup");
    
    // Publish queue UI
    this.publish_queue = document.querySelector(".sp_main");
    this.publish_queue_items = this.publish_queue.querySelector("tbody");
    this.publish_queue_publish_btn = this.publish_queue.querySelector("#td11_publish_all");
    this.publish_queue_unpublish_btn = this.publish_queue.querySelector("#td11_unpublish_all");
    this.publish_queue_clear_btn = this.publish_queue.querySelector("#td11_clear_all");
    this.publish_queue_lvl_selector = this.publish_queue.querySelector(".sp_batch_sel select");

    // Controls
    this.publish_btn = this.dashboard_menu.querySelector("#cm_pub_publish");
    this.unpublish_btn = this.dashboard_menu.querySelector("#cm_pub_unpublish");

    // Structures   *need to work on these*
    this.sup_publishing;
    this.custom_queue_items = [];
    this.publications_refs = [];
    this.publishable_batches = [];
    this.list_levels = [];
    this.list_items = [];
    this.items = [];
    this.levels = {};

    // Flags
    this.batches_loaded = false;

    this.init();
  }

  init()
  {
    console.debug("Tridion Extension v"+ this._v);
    var _self = this;
    
    this.add_actions();
    this.add_observers();
    this.set_message_handler();
    this.get_localStorage();
    
    this.init_UI();
    this.restore_backup();
  }
    
// NEED TO WORK ON THIS
  init_UI()
  {
    var _self = this;
        
    var right_clk = ()=>{
      let evt = new MouseEvent("contextmenu", {bubbles:true});
      let element = _self.items.querySelector("tr .col2[value='16']");
      if(!element)
      {
        alert("There is not support for these type of components yet");
        return;
      }
      element.dispatchEvent(evt);
    }

    var mouse_clk = element =>{
      var evt = new MouseEvent("click", {
        bubbles: true,
        cancelable: false,
        view: window
      });
      element.dispatchEvent(evt);
    }

    // Custom queue thumbnail    
    let custom_queue_toggle = document.createElement("div");
    custom_queue_toggle.id = "CustomQueueBtn";
    custom_queue_toggle.className = "button CustomQueue ribbonitem";
    custom_queue_toggle.title = "Toggle Custom Queue";
    custom_queue_toggle.tabIndex = 1;
    custom_queue_toggle.style["user-select"] = "none";
    custom_queue_toggle.setAttribute("c:controltype", "Tridion.Controls.RibbonButton");
    custom_queue_toggle.innerHTML = '<div class="image">&nbsp;</div><div class="text">Custom<br>Queue</div>';
    document.querySelector("#PublishingQueueBtn").insertAdjacentElement(
      'beforebegin', custom_queue_toggle
    );
    custom_queue_toggle.addEventListener(
      'click',
      () => this.publish_queue.parentElement.style.display = this.publish_queue.parentElement.style.display === "block"? "none":"block"
    );

    // Multi selection
    var multiple_sel = (element, first_selection)=>{ 
      var evt = new MouseEvent("mousedown", {
        bubbles: true,
        ctrlKey: !first_selection
      });
      element.dispatchEvent(evt);
    }

    // custom queue publish button
    this.publish_queue_publish_btn.addEventListener("click",()=>{
      if(!fill()) return;
      right_clk();
      mouse_clk(_self.publish_btn);
      let items = _self.items.querySelectorAll(".cp_item");
      items.forEach(item =>item.remove());
    })

    // custom queue unpublish button
    this.publish_queue_unpublish_btn.addEventListener("click",()=>{
      if(!fill()) return;
      right_clk();
      mouse_clk(_self.unpublish_btn);
      let items = _self.items.querySelectorAll(".cp_item");
      items.forEach(item =>item.remove());
    })

    // Remove all elements from custom queue
    this.publish_queue_clear_btn.addEventListener("click", 
      (event, tbody = this.publish_queue_items)=>{
        while (tbody.firstChild) {
          tbody.removeChild(tbody.firstChild);
        }
        _self.custom_queue_items = [];
    });    

    // Add items to dashboard list items
    var fill = function ()
    {
      var levels = [];
      let matches = window.location.hash.match(/(\w+)-(\w+-\w+)/);
      var curr_lvl = matches[1];
      var curr_folder = matches[2];
      var batch_id = _self.publish_queue_lvl_selector.options[_self.publish_queue_lvl_selector.selectedIndex].id;

      _self.publishable_batches.forEach( batch =>{
        if(!levels.length && batch.id == batch_id) levels = batch.conf;
      });

      var valid_folder = false;
      _self.custom_queue_items.forEach( item => {
        if(item.folder == curr_folder && !valid_folder) valid_folder = true;
      });
      if(!levels.contains(curr_lvl) || !valid_folder){
        var msg = "You are not in a valid level/folder to publish, " +
                  "would you like to do move to valid location and publish current queue?";
        if(confirm(msg)){
          
          // move to first lvl in batch (it does not matter really)
          // save pending action to publish and also the queue and selected batch
          var pending_actions = [
            { 
              action:"publish",             
              batch: batch_id,
            }
          ];

          // Put the object into storage
          localStorage.setItem('tdx_pending_actions', JSON.stringify(pending_actions));
          
          // navigate to current path but with valid level and folder to publish
          var new_url = window.location.href.replace(/(\S+:)\d+(\S+)/, '$1'+levels[0]+'-'+_self.custom_queue_items[0].folder);
          window.location = new_url;
          window.location.reload();
        }
        return false;
      }

      var first_selection = true;
      if(_self.items.length == 0) _self.update_frame_items();
      var tbody = _self.items.querySelector("tbody");

      _self.custom_queue_items.forEach(
        item =>{
          levels.forEach( lvl =>{
            let new_item = document.createElement("tr");
            let new_id = item.id.replace(/(\S+:)\d+(-\d+)/, '$1' + lvl + '$2');

            new_item.id = new_id;
            new_item.name = item.name;
            new_item.className = "item even cp_item";
            new_item.setAttribute("c:drawn", true);

            tbody.appendChild(new_item);
            multiple_sel(new_item, first_selection);
            if(first_selection) first_selection = !first_selection;
          });
        }
      );
      
      return true;
    };
  }
  
/* Actions*/
  enable_publish_items()
  {
    var listeners = [];
    var callback;

    callback = ()=>
    {
      console.log("Publishing items");
    }    
    listeners.push({ "type": "click", "callback" : callback });
    this.feature_wr(this.pro_publishing, features.publish_items, listeners);
  }

  add_to_custom_queue(item)
  {
    this.custom_queue_items.push(item);

    let tr, name, type, last_mod;
    tr = document.createElement("tr");
    name = document.createElement("td");
    type = document.createElement("td");
    last_mod = document.createElement("td");

    tr.id = item.id;
    name.textContent = item.name;
    type.textContent = item.type;
    last_mod.textContent = item.last_mod;

    tr.appendChild(name);
    tr.appendChild(type);
    tr.appendChild(last_mod);

    this.publish_queue.querySelector("tbody").appendChild(tr);
  }

  enable_add_to_custom_queue()
  {
    var _self = this;
    var listeners = [];
    var callback;
    callback = ()=>{
      console.log("Add to custom queue");

      var current_folder = window.location.hash.match(/\w+-(\w+-\w)/)[1];
      _self.items.querySelectorAll(".selected")
        .forEach( item => 
        {
          let item_details = 
          {
            'id': item.id,
            'name': item.querySelector(".col1 > div").textContent,
            'type': item.querySelector(".col2 > div").textContent,
            'last_mod': item.querySelector(".col4 > div").textContent,
            'folder' : current_folder
          };
          _self.add_to_custom_queue(item_details);
        }
      );
    }
    listeners.push({"type":"click", "callback": callback });
    this.feature_wr(this.add_to_queue, features.custom_queue, listeners);
  }

  enable_open_multiple_items()
  {
    var _self = this;
    var listeners = [];
    var callback;

    callback = function()
    {
      _self.update_frame_items();              // quick fix for
      if(_self.items.length == 0) return;
      var selected_items = _self.items.querySelectorAll("tr.selected");
      
      selected_items
        .forEach(function(item) 
        {
          if(item.type == 16)  // component
          {
            console.log("Opening", `${item.tcm_id} from lvl-id: ${item.lvl}`);
            var url_base = `${document.location.origin}/WebUI/item.aspx?tcm=16#id=tcm:${item.lvl}-${item.tcm_id}`;
            window.postMessage({action: "open_item", url: url_base}, "*");    // send a message to background to handle request
          }
          else        // everything else
          {
            console.error("Type not supported yet :P");
          }
        });
      // Tridion does not support double click trigger on folder      
    }
    listeners.push({ "type": "click", "callback" : callback });
    this.feature_wr(this.multiple_open, features.open_items, listeners);
  }

/* Storage */
  get_localStorage()
  {
    window.postMessage({action: "get_publishable_batches"}, "*");
  }
  
  backup_save()
  {
    // backup queue
    var queue = { items: this.custom_queue_items };
    localStorage.setItem('tdx_bk_queue', JSON.stringify(queue));
  }

  update_frame_items()
  {
    this.frame_items = document.querySelector("#FilteredItemsList_frame_details");
    this.items = this.frame_items.contentWindow.document.querySelector("table");
    this.process_items();
  }

/* Wrappers */
  observer_wr(target, config, callback)
  {
    var observer = new MutationObserver(callback);
    observer.observe(target, config);
    // observer.disconnect();
  }

  feature_wr(element, feature, listeners, position)
  {
    element = new DashboardMenuFeature(feature, listeners);
    this.dashboard_menu.appendChild(element);
  }

/* Main Functions */

  restore_backup()
  {
    if(!localStorage.tdx_bk_queue) return;
    let items = JSON.parse(localStorage.tdx_bk_queue);
    var _self = this;

    items.items.forEach(
      item => this.add_to_custom_queue(item)
    );
  }

  lookup_pending_actions(){
    if(!localStorage.tdx_pending_actions) return;
    var p_actions = JSON.parse(localStorage.tdx_pending_actions);
    var p_action;

    while(p_action = p_actions.pop()){
      
      // select option and be sure that batches had been loaded
      let options = this.publish_queue_lvl_selector.options;
      for(let i =0; i< options.length; i++){
        if(options[i].id == p_action.batch){
          options[i].selected = true;
          break;
        }
      }

      var evt = new MouseEvent("click", {
        bubbles: false,
        cancelable: false,
        view: window
      });

      switch(p_action.action){
        case "publish":
          this.publish_queue_publish_btn.dispatchEvent(evt);
          break;
        case "unpublish":
          this.unpublish_queue_publish_btn.dispatchEvent(evt);
          break;
        default:
          break;
      }
    }
    localStorage.removeItem("tdx_pending_actions");
  }
// LOOK UP!

  add_actions()
  {
    var sep = document.createElement("li");
    sep.className = "separator";
    this.dashboard_menu.appendChild(sep);

    this.enable_publish_items();
    this.enable_open_multiple_items();
    this.enable_add_to_custom_queue();
  }

  add_observers()
  {
    var _self = this;
    
    // Observer for loading on item list
    this.observer_wr(
      this.dashboard_list, 
      { subtree: true, childList: true}
      ,function(){
        _self.list_items = document.querySelector("#FilteredItemsList_frame_details");
        if(_self.list_items != null)
        {
          _self.list_items.addEventListener("load",function() 
          {
            if(this.contentWindow.document.body.innerText == "") return;
            _self.update_frame_items();

            // while(!_self.batches_loaded);
            _self.lookup_pending_actions();
          });
        }
      }
    );


    // Backup
    window.addEventListener("hashchange", e =>_self.backup_save());
    window.addEventListener("beforeunload", e =>_self.backup_save());
  }

  process_items()
  {
    var _self = this;
    this.items.querySelectorAll("tr.item")
      .forEach(function(row) 
      {
        var cols = row.querySelectorAll("td");
        var item_level = cols[3].querySelector("div");
        var txt_level = _self.unicode_to_ascii(item_level.innerText);

        row.tcm_id = row.id.split(':')[1].split('-')[1];
        row.type = cols[2].getAttribute("value");
        
        row.lvl = (txt_level == "" || txt_level == "(Local copy)")? 
          row.id.split(':')[1].split('-')[0] : _self.levels[txt_level];
      });
  }

/* UTILS */  
  get_id_by_lvl(level)    // Deprecated
  {
    return this.levels[level];
  }

  /**
   * Convert any string from unicode to ascii values
   * 
   * @param {any} string 
   * @returns {out} converted string
   */
  unicode_to_ascii(str)
  {
    var out = "";
    for (var i = 0; i < str.length; i++) {
        out += String.fromCharCode(str.charCodeAt(i) % 128);
    }
    return out;
  }


  /**
   *  Add publishable custom batches to selector
   */
  update_publishable_batches(){
    while (this.publish_queue_lvl_selector.firstChild) {
      this.publish_queue_lvl_selector.removeChild(this.publish_queue_lvl_selector.firstChild);
    }

    this.publishable_batches.forEach(publishable_batch =>{
      var option = document.createElement("option");
      option.textContent = publishable_batch.name;
      option.id = publishable_batch.id;

      this.publish_queue_lvl_selector.append(option);
    })
    
    this.batches_loaded = true;
  }

  /**
   * Handle and filter messages sent to this page
   */
  set_message_handler(){
    window.addEventListener("message", event =>{ 
      if (event.source !== window) return;

      switch(event.data.action){
        case "publishable_batches":
          this.publishable_batches = event.data.data;
          this.update_publishable_batches();
          break;
        default:
          break;
      }
    }, false);
  }
};