// Author: Daniel G (oscar-daniel.gonzalez@hp.com)

var features = 
{
  open_items: 
  {
    id: "open_mult_items",
    class:"item Open", 
    title: "Open selected items"
  },
  publish_items:
  {
    id: "publihs_mult_items",
    class:"item Publish", 
    title: "Publish selected items"
  }
};

class DashboardFeature
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
    this.ctx_menu = document.querySelector("#DashboardContextMenu");
    this.dashboard_tree = document.querySelector("#DashboardTree iframe");
    this.dashboard_list = document.querySelector("#FilteredDashboardList");
    this.publications_refs = [];
    this.list_lvls = [];
    this.list_items = [];
    this.items = [];
    this.lvls = [];

    this.init();
  }

  init()
  {
    console.debug("Tridion Extension v"+ this._v +", made by Daniel G [oscar-daniel.gonzalez@hp.com]");
    var _self = this;
    
      this.publications_refs = this.dashboard_tree.contentDocument.querySelectorAll("div.rootNode.populated div.children div.node");
      
      this.publications_refs
        .forEach(function(publication) 
        {
          var id = publication.id.split(':')[1].split('-')[1];
          var lvl = publication.querySelector(".header .title").title;
          lvl = lvl.slice(0, lvl.indexOf(" ("));  // lvl   remove what is between parenthesis
          _self.lvls[id] = unescape(lvl);
        });
    
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

    this.pro_publishing = new DashboardFeature(features.publish_items, listeners);
    this.ctx_menu.appendChild(this.pro_publishing);
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
            console.log("Opening tcm"+ item.tcm_id + " from " + _self.lvls[item.lvl]);
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

    this.mult_open = new DashboardFeature(features.open_items, listeners);
    this.ctx_menu.appendChild(this.mult_open);
  }

/* Storage */
  get_localStorage()
  {
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

/* Main Functions */
  add_actions()
  {
    var sep = document.createElement("li");
    sep.className = "separator";
    this.ctx_menu.appendChild(sep);

    this.enable_publish_items();
    this.enable_open_mult_items();
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
        row.lvl = _self.get_id_by_lvl(txt_lvl);  
      });
  }

/* UTILS */  
  get_id_by_lvl(lvl)
  {
    return this.lvls.indexOf(lvl);
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