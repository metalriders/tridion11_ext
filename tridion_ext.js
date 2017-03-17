new class Tridion_Ext
{  
  constructor()
  {
    this._v = 1.0;
    this.dashboard = document.querySelector("#DashboardContextMenu");
    this.dashboard_list = document.querySelector("#FilteredDashboardList");
    this.list_items = undefined;
    this.items = undefined;

    this.init();
  }

  observer_wrapper(target, config, callback)
  {
    var observer = new MutationObserver(callback);
    observer.observe(target, config);
    return function removeElementChange() {
        observer.disconnect();
    };
  }
  
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
      console.log("Do magic");
    }    

    this.dashboard.appendChild(this.pro_publishing);
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
      var sel = _self.items.querySelectorAll("tr.selected");     // check dependency
      // Tridion does not support double click trigger on folders
      console.log("Do magic");
    }

    this.dashboard.appendChild(this.mult_open);
  }

  get_localStorage()
  {
  }

  init()
  {
    var _self = this;
    console.debug("Tridion Extension v"+ this._v +", made by Daniel G [oscar-daniel.gonzalez@hp.com]");
    
    // Separate new actions
    var sep = document.createElement("li");
    sep.className = "separator";
    this.dashboard.appendChild(sep);

    this.observer_wrapper(
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
    this.enable_pro_publishing();
    this.enable_open_mult_items();
  }

  update_frame_items()
  {
    this.frame_items = document.querySelector("#FilteredItemsList_frame_details");
    this.items = this.frame_items.contentWindow.document.querySelector("table");
  }
};