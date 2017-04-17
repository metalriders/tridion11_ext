// Author: Daniel G (oscar-daniel.gonzalez@hp.com)

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
    
    this.element.addEventListener("mouseover",function(){        
      Tridion.Controls.ContextMenu.prototype._hightlightItem(this); 
    });
    this.element.addEventListener("click",function(){
      this.parentElement.style.visibility = "hidden";
    });

    listeners.forEach(function(listener) {
      _self.element.addEventListener(listener.type, listener.callback);
    });

    return this.element;
  }
}

new class Tridion_Ext
{  
  constructor()
  {
    this._v = 1.0;
    // Context UI
    this.dashboard = document.querySelector(".dashboard");
    this.dashboard_menu = document.querySelector("#DashboardContextMenu");
    this.dashboard_tree = document.querySelector("#DashboardTree iframe");
    this.dashboard_list = document.querySelector("#FilteredDashboardList");
    
    // Publish queue UI
    this.publish_queue = document.querySelector(".sp_main");
    this.publish_queue_items = this.publish_queue.querySelector("tbody");
    this.publish_queue_publishbtn = this.publish_queue.querySelector("#td11_publish_all");
    this.publish_queue_unpublishbtn = this.publish_queue.querySelector("#td11_unpublish_all");
    this.publish_queue_clearbtn = this.publish_queue.querySelector("#td11_clear_all");
    this.publish_queue_lvl_selector = this.publish_queue.querySelector(".sp_batch_sel select");

    // Controls
    this.publish_btn = this.dashboard_menu.querySelector("#cm_pub_publish");
    this.unpublish_btn = this.dashboard_menu.querySelector("#cm_pub_unpublish");

    // Structures   *need to work on these*
    this.sup_publishing;
    this.custom_queue_items = [];
    this.publications_refs = [];
    this.publishable_batches = [];
    this.list_lvls = [];
    this.list_items = [];
    this.items = [];
    this.lvls = {};
    this.init();
  }

  init()
  {
    console.debug("Tridion Extension v"+ this._v +", made by Daniel G [oscar-daniel.gonzalez@hp.com]");
    var _self = this;
    
    this.publications_refs = this.dashboard_tree.contentDocument.querySelectorAll("div.rootNode.populated > div.children.visible > div.node");
    
    this.publications_refs
      .forEach(function(publication) 
      {
        var id = publication.id.split(':')[1].split('-')[1];
        var lvl = publication.querySelector(".header .title").title;
        lvl = lvl.replace(/ \(tcm.*\)/g, "");  // lvl   remove what is between parenthesis
        _self.lvls[unescape(lvl)] = id;
      });

    window.postMessage({action: "init_levels", data: this.lvls}, "*");

    this.add_actions();
    this.add_observers();
    this.set_message_handler();
    this.get_localStorage();
    
    this.init_UI();
    this.restore_backup();
  }
  
/* Actions*/
  enable_publish_items()
  {
    var listeners = [];
    var callback;

    callback = function(){
      console.log("Publishing items");
    }    
    listeners.push({ "type": "click", "callback" : callback });
    this.feature_wr(this.pro_publishing, features.publish_items, listeners);
  }

  add_to_cust_queue(item)
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

  enable_add_to_cust_queue()
  {
    var _self = this;
    var listeners = [];
    var callback;
    callback = function(){
      console.log("Add to custom queue");
      _self.items.querySelectorAll(".selected").forEach( 
        item => {
        let item_details = {
          'id': item.id,
          'name': item.querySelector(".col1 > div").textContent,
          'type': item.querySelector(".col2 > div").textContent,
          'last_mod': item.querySelector(".col4 > div").textContent
        };
        _self.add_to_cust_queue(item_details);
      }
      );
    }
    listeners.push({"type":"click", "callback": callback });
    this.feature_wr(this.add_to_queue, features.custom_queue, listeners);
  }

  enable_open_mult_items()
  {
    var _self = this;
    var listeners = [];
    var callback;

    callback = function()
    {
      _self.update_frame_items();              // quick fix for
      if(_self.items.length == 0) return;
      var sel_items = _self.items.querySelectorAll("tr.selected");
      
      sel_items
        .forEach(function(item) 
        {
          if(item.type == 16)  // component
          {
            console.log("Opening tcm"+ item.tcm_id + " from lvl-id:" + item.lvl);
            var url_base = document.location.origin +"/WebUI/item.aspx?tcm=16#id=tcm:"+item.lvl+"-"+item.tcm_id;
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
    this.feature_wr(this.mult_open, features.open_items, listeners);
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
    return function removeElementChange() {
        observer.disconnect();
    };
  }

  feature_wr(element, feature, listeners, position)
  {
    element = new DashboardMenuFeature(feature, listeners);
    this.dashboard_menu.appendChild(element);
  }

/* Main Functions */
  
// NEED TO WORK ON THIS
  init_UI()
  {
    var _self = this;

    this.publish_queue.style.visibility="visible"

    var right_clk = ()=>{
      var evt = new MouseEvent("contextmenu", {bubbles:true});      
      _self.items.querySelector("tr .col2[value='16']").dispatchEvent(evt);  //look for a component and dispatchEvent on it
    }
    var mouse_clk = (element)=>{
      var evt = new MouseEvent("click", {
        bubbles: true,
        cancelable: false,
        view: window
      });
      element.dispatchEvent(evt);
    }

    // Multi selection
    var mult_sel = (element, first_selection)=>{ 
      var evt = new MouseEvent("mousedown", {
        bubbles: true,
        ctrlKey: !first_selection
      });
      element.dispatchEvent(evt);
    }

    // custom queue publish button
    this.publish_queue_publishbtn.addEventListener("click",()=>{
      if(!fill()) return;
      right_clk();
      mouse_clk(_self.publish_btn);
      let items = _self.items.querySelectorAll(".cp_item");
      items.forEach((item)=>item.remove());
    })

    // custom queue unpublish button
    this.publish_queue_unpublishbtn.addEventListener("click",()=>{
      if(!fill()) return;
      right_clk();
      mouse_clk(_self.unpublish_btn);
      let items = _self.items.querySelectorAll(".cp_item");
      items.forEach((item)=>item.remove());
    })

    // Remove all elements from custom queue
    this.publish_queue_clearbtn.addEventListener("click", 
      (event, tbody = this.publish_queue_items)=>{
        while (tbody.firstChild) {
          tbody.removeChild(tbody.firstChild);
        }
        _self.custom_queue_items = [];
    });    

    // Add items to dashboard list items
    var fill = function ()
    {
      var lvls = [];
      var curr_lvl = window.location.href.match(/(\d+)-\d+/)[1];
      var batch_id = _self.publish_queue_lvl_selector.options[_self.publish_queue_lvl_selector.selectedIndex].id;

      _self.publishable_batches.forEach((batch)=>{
        if(!lvls.length && batch.id == batch_id) lvls = batch.conf;
      });

      if(!lvls.contains(curr_lvl)){
        var msg = "You are not in a publishable level of your selected batch, would you like to move and publish?";
        if(confirm(msg)){
          
          // move to first lvl in batch (it does not matter really)
          // save pending action to publish and also the queue and selected batch
          var pending_actions = [
            { 
              action:"publish",             
              batch: batch_id
            }
          ];

          // Put the object into storage
          localStorage.setItem('tdx_pending_actions', JSON.stringify(pending_actions));
          
          // navigate to current path but with publishable level
          var new_url = window.location.href.replace(/(\S+:)\d{3}(\S+)/, '$1'+lvls[0]+'$2');
          window.location = new_url;
          window.location.reload();
        }
        return false;
      }
      var first_selection = true;
      if(_self.items.length == 0) _self.update_frame_items();
      var tbody = _self.items.querySelector("tbody");

      _self.publish_queue_items.querySelectorAll("tr").forEach(item => {
        lvls.forEach(lvl=>{ 
          var new_id = item.id;
          new_id = new_id.replace(/(\S+:)\d+(-\d+)/, '$1' + lvl + '$2');
          var new_item = document.createElement("tr");
          new_item.id = new_id;
          new_item.name = item.title;
          new_item.className = "item even cp_item";
          new_item.setAttribute("c:drawn", true);

          tbody.appendChild(new_item);
          mult_sel(new_item, first_selection);
          if(first_selection) first_selection = !first_selection;
        })
      });
      return true;
    };
  }

  restore_backup()
  {
    if(!localStorage.tdx_bk_queue) return;
    let items = JSON.parse(localStorage.tdx_bk_queue);
    var _self = this;

    items.items.forEach(
      item => this.add_to_cust_queue(item)
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
          this.publish_queue_publishbtn.dispatchEvent(evt);
          break;
        case "unpublish":
          this.unpublish_queue_publishbtn.dispatchEvent(evt);
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
    this.enable_open_mult_items();
    this.enable_add_to_cust_queue();
  }

  add_observers()
  {
    var _self = this;
    
    // Observer for loading on item list
    this.observer_wr(
      this.dashboard_list, 
      { subtree: true, childList: true}
      ,() => {
        _self.list_items = document.querySelector("#FilteredItemsList_frame_details");
        if(_self.list_items != null)
        {
          _self.list_items.addEventListener("load",function() 
          {
            if(this.contentWindow.document.body.innerText == "") return;
            _self.update_frame_items();
          });
        }
      }
    );

    // Observer for batches loading
    this.observer_wr(
      this.publish_queue_lvl_selector, 
      {subtree:true, childList:true},
      () => {
        _self.lookup_pending_actions();
      }
    );

    // Backup
    window.addEventListener("hashchange", (e)=>_self.backup_save());
    window.addEventListener("beforeunload", (e)=>_self.backup_save());
  }

  process_items()
  {
    var _self = this;
    this.items.querySelectorAll("tr.item")
      .forEach(function(row) 
      {
        var cols = row.querySelectorAll("td");
        var item_lvl = cols[3].querySelector("div");
        var txt_lvl = _self.unicode_to_ascii(item_lvl.innerText);

        row.tcm_id = row.id.split(':')[1].split('-')[1];
        row.type = cols[2].getAttribute("value");
        
        row.lvl = (txt_lvl == "" || txt_lvl == "(Local copy)")? 
          row.id.split(':')[1].split('-')[0] : _self.lvls[txt_lvl];
      });
  }

/* UTILS */  
  get_id_by_lvl(lvl)    // Deprecated
  {
    return this.lvls[lvl];
  }

  unicode_to_ascii(str)
  {
    var out = "";
    for (var i = 0; i < str.length; i++) {
        out += String.fromCharCode(str.charCodeAt(i) % 128);
    }
    return out;
  }

  // Add publishable custom batches to selector
  update_publishable_batches(){
    while (this.publish_queue_lvl_selector.firstChild) {
      this.publish_queue_lvl_selector.removeChild(this.publish_queue_lvl_selector.firstChild);
    }

    this.publishable_batches.forEach((publishable_batch)=>{
      var option = document.createElement("option");
      option.textContent = publishable_batch.name;
      option.id = publishable_batch.id;

      this.publish_queue_lvl_selector.append(option);
    })
  }
/* MESSAGES */
  set_message_handler(){
    window.addEventListener("message", (event)=>{ 
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