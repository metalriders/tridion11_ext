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
    this.publish_queue_lvl_selector = this.publish_queue.querySelector(".sp_batch_sel");

    // Controls
    this.publish_btn = this.dashboard_menu.querySelector("#cm_pub_publish");
    this.unpublish_btn = this.dashboard_menu.querySelector("#cm_pub_unpublish");

    // Structures
    this.sup_publishing;
    this.custom_queue_items = [];
    this.publications_refs = [];
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

    this.init_UI();
    this.add_actions();
    this.add_observers();
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

  enable_add_to_cust_queue()
  {
    var _self = this;
    var listeners = [];
    var callback;
    callback = function(){
      console.log("Add to custom queue");
      _self.items.querySelectorAll(".selected").forEach( item =>{
        _self.custom_queue_items.push(item);
        var details = 
        {
          'id': item.id,
          'name': item.querySelector(".col1 > div").textContent,
          'type': item.querySelector(".col2 > div").textContent,
          'last_mod': item.querySelector(".col4 > div").textContent
        };
        var tr, name, type, last_mod;
        tr = document.createElement("tr");
        name = document.createElement("td");
        type = document.createElement("td");
        last_mod = document.createElement("td");

        tr.id = details.id;
        name.textContent = details.name;
        type.textContent = details.type;
        last_mod.textContent = details.last_mod;

        tr.appendChild(name);
        tr.appendChild(type);
        tr.appendChild(last_mod);

        _self.publish_queue.querySelector("tbody").appendChild(tr);
      });
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
    window.postMessage({action: "get_publishing_batches"}, "*");
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

    // custom queue publish button
    this.publish_queue_publishbtn.addEventListener("click",()=>{
      right_clk();
      mouse_clk(_self.publish_btn);
    })

    // custom queue unpublish button
    this.publish_queue_unpublishbtn.addEventListener("click",()=>{
      right_clk();
      mouse_clk(_self.unpublish_btn);
    })

    // Remove all elements from custom queue
    this.publish_queue_clearbtn.addEventListener("click", 
      (event, tbody = this.publish_queue_items)=>{
        while (tbody.firstChild) {
          tbody.removeChild(tbody.firstChild);
        }
    });

    // Request custom batches {id, name} from local storage
    // for each publish valid batch add it to queue
    //  this.publish_queue_lvl_selector.append( <option id="batch_id"> batch name</option>);

    // Add items to dashboard list items
    var fill = function ()
    {
      var lvls = [245,224];
      var tbody = _self.items.querySelector("tbody");
      _self.publish_queue_items.querySelectorAll("tr").forEach(item => {
        lvls.forEach(lvl=>{
          var new_id = item.id;
          new_id = new_id.replace(/(\S+:)\d+(-\d+)/, '$1' + lvl + '$2');
          var new_item = document.createElement("tr");
          new_item.id = new_id;
          tbody.appendChild(new_item);
          // Set new_item selected using Tridion API to publish to catch the item
        })
      });
    };
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
    
    this.observer_wr(
      this.dashboard_list, { subtree: true, childList: true},function()
      {
        _self.list_items = document.querySelector("#FilteredItemsList_frame_details");
        if(_self.list_items != null)
        {
          _self.list_items.addEventListener("load",function() 
          {
            if(this.contentWindow.document.body.innerText == "") return;
            _self.update_frame_items();
          });
          this.disconnect();
        }
      });
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
};