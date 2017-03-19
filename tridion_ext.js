// Author: Daniel G (oscar-daniel.gonzalez@hp.com)

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
  enable_pro_publishing()
  {
    var _self = this;
    this.pro_publishing = document.createElement("li");
    this.pro_publishing.className  = "item Publish";
    this.pro_publishing.id = "improved_sel_publish";

    var pro_publishing_div = document.createElement("div");
    pro_publishing_div.className = "image";
    pro_publishing_div.setAttribute("unselectable", "on");

    var pro_publishing_span = document.createElement("span");
    pro_publishing_span.innerHTML = "Automated Publishing";
    
    this.pro_publishing.appendChild(pro_publishing_div);
    this.pro_publishing.appendChild(pro_publishing_span);

    this.pro_publishing.onmouseover = function() 
    {
      Tridion.Controls.ContextMenu.prototype._hightlightItem(this)
    };

    this.pro_publishing.onclick = function()
    {
      console.log("Publishing items");
    }    

    this.ctx_menu.appendChild(this.pro_publishing);
  }

  enable_open_mult_items()
  {
    var _self = this;
    this.mult_open = document.createElement("li");
    this.mult_open.className  = "item Open";
    this.mult_open.id = "open_mult_items";

    var mult_open_div = document.createElement("div");
    mult_open_div.className = "image";
    mult_open_div.setAttribute("unselectable", "on");

    var mult_open_span = document.createElement("span");
    mult_open_span.innerHTML = "Open selected items";
    
    this.mult_open.appendChild(mult_open_div);
    this.mult_open.appendChild(mult_open_span);


    this.mult_open.onmouseover = function() 
    {
      Tridion.Controls.ContextMenu.prototype._hightlightItem(this)
    };

    this.mult_open.onclick = function()
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
            var url_base = docuemnt.location.origin +"/WebUI/item.aspx?tcm=16#id=tcm:"+item.lvl+"-"+item.tcm_id;
            window.postMessage({action: "open_item", url: url_base}, "*");    // send a message to background to handle request
          }
          else        // everything else
          {
            console.error("Type not supported yet :P");
          }
        });
      // Tridion does not support double click trigger on folder      
    }

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

    this.enable_pro_publishing();
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