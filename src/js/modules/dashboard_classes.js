/**
 * 
 * @class DashBoardMenuFeature
 */
class DashboardMenuFeature
{
  constructor(feature, listeners)
  {
    var _self = this;
    this.DOM_li = document.createElement("li");
    this.DOM_li.className  = feature.class;
    this.DOM_li.id = feature.id;

    let DOM_div = document.createElement("div");
    DOM_div.className = "image";
    DOM_div.setAttribute("unselectable", "on");

    let DOM_span = document.createElement("span");
    DOM_span.innerHTML = feature.title;
    
    this.DOM_li.appendChild(DOM_div);
    this.DOM_li.appendChild(DOM_span);
    
    this.DOM_li.addEventListener(
      "mouseover", ()=> Tridion.Controls.ContextMenu.prototype._hightlightItem(this.DOM_li)
    );
    this.DOM_li.addEventListener(
      "click", ()=> this.DOM_li.parentElement.style.visibility = "hidden"
    );

    listeners.forEach(
      listener => _self.DOM_li.addEventListener(listener.type, listener.callback)
    );

    return this.DOM_li;
  }
}

/**
 * 
 * 
 * @class DashboardMenuContext
 */
class DashboardContextMenu{
  constructor() {
    this.container = document.querySelector('#DashboardContextMenu');
    this.publish_btn = this.container.querySelector('#cm_pub_publish');
    this.unpublish_btn = this.container.querySelector('#cm_pub_unpublish');

    this.initUI();
  }

  initUI() {
    let sep = document.createElement("li");
    sep.className = "separator";
    this.container.appendChild(sep);
  }

  addFeature(element, feature, listeners, position)
  {
    element = new DashboardMenuFeature(feature, listeners);
    this.container.appendChild(element);
  }
}

/**
 * 
 * 
 * @class DashboardPublications
 */
class DashboardPublications{
  set levels(levels) { this._levels = levels }
  get levels() { return this._levels }

  constructor(){
    this.container = document.querySelector('#DashboardTree iframe').contentWindow.document;
    this._levels = undefined;
  }
}

/**
 * 
 * 
 * @class DashboardList
 */
class DashboardList{
  set items(items) { this._items = items }
  get items() { return this._items }

  constructor(){
    this.container = document.querySelector('#FilteredDashboardList');
  }
  
  updateItems(publications)
  {
    this.items_list = this.iframe.contentWindow.document.querySelector("tbody");
    this.processItems(publications);
  }
  // can be moved to another class
  processItems(publications)
  {
    var _self = this;
    this.items_list.querySelectorAll("tr.item")
      .forEach(function(row) 
      {
        let columns = row.querySelectorAll("td");
        let item_level = columns[3].querySelector("div");
        let txt_level = unicodeToASCII(item_level.innerText);

        row.tcm_id = row.id.split(':')[1].split('-')[1];
        row.type = columns[2].getAttribute("value");
        
        row.lvl = (txt_level == "" || txt_level == "(Local copy)")? 
          row.id.split(':')[1].split('-')[0] : publications[txt_level];
      });
  }
}
