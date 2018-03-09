const features = 
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
  }
};

const ITEM_TYPE_FOLDER = 2;
const ITEM_TYPE_PINK_FOLDER = 4;
const ITEM_TYPE_WEBPAGE = 64;
const ITEM_TYPE_COMPONENT = 16;

/**
 * 
 * Instant instantiation
 * @class Tridion_Ext
 */
class Tridion_Ext
{  
  constructor()
  {
    this._version = '0.1.2';

    // Context UI
    this.dashboard = document.querySelector('.dashboard');

    this.context_menu = new DashboardContextMenu();
    this.publications = new DashboardPublications();
    this.dashboard_list = new DashboardList();
    
    // Structures   *need to work on these*
    this.publishable_batches = [];
    this.levels = {};

    // Flags
    this.batches_loaded = false;

    this.init();
  }

  // GETTERS
  get Custom_Queue () { return this.custom_queue }
  get validComponentToPublish() 
  {
    return this.dashboard_list.items_list.querySelector(`tr .col2[value='${ITEM_TYPE_COMPONENT}']`) ||
    this.dashboard_list.items_list.querySelector(`tr .col2[value='${ITEM_TYPE_WEBPAGE}']`)||
    this.dashboard_list.items_list.querySelector(`tr .col2[value='${ITEM_TYPE_PINK_FOLDER}']`);
  }

  init()
  {
    console.debug("Tridion Extension v"+ this._version);
    var _self = this;
    
    this.custom_queue = new CustomQueue();

    this.addActions();
    this.addObservers();
    this.setMessageHandler();
    this.getLocalStorage();
    
    this.initUI();
    this.restoreBackup();
  }
  

// NEED TO WORK ON THIS
  initUI()
  {
    var _self = this;
        
    var right_clk = ()=>{
      let evt = new MouseEvent("contextmenu", {bubbles:true});
      let element = _self.dashboard_list.items_list.querySelector('tr .col2[value="16"]');
      if(!element)
      {
        alert("There is not support for these type of components yet");
        return;
      }
      element.dispatchEvent(evt);
    }

/* potential refactor */
     // custom queue publish button
    this.custom_queue.publish_btn.addEventListener("click",()=>{
      let element = _self.validComponentToPublish;
      if(!fill() && !element) return;

      rightClick(element);
      leftClick(_self.context_menu.publish_btn);

      let items = _self.dashboard_list.items_list.querySelectorAll(".cp_item");
      items.forEach(item =>item.remove());
    })

    // custom queue unpublish button
    this.custom_queue.unpublish_btn.addEventListener("click",()=>{
      let element = _self.validComponentToPublish;
      if(!fill() && !element) return;

      rightClick(element);
      leftClick(_self.context_menu.unpublish_btn);

      let items = _self.dashboard_list.items_list.querySelectorAll(".cp_item");
      items.forEach(item =>item.remove());
    })
/* end potential refactor */

    // Add items to dashboard list items
    var fill = function ()
    {
      var levels = [];
      let matches = window.location.hash.match(/(\w+)-(\w+-\w+)/);
      var curr_lvl = matches[1];
      var curr_folder = matches[2];
      var batch_id = _self.custom_queue.selectedBatch;

      _self.publishable_batches.forEach( batch =>{
        if(!levels.length && batch.id == batch_id) levels = batch.conf;
      });

      var valid_folder = false;
      _self.custom_queue.items.forEach( item => {
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
          var new_url = window.location.href.replace(/(\S+:)\d+(\S+)/, '$1'+levels[0]+'-'+_self.custom_queue.items[0].folder);
          window.location = new_url;
          window.location.reload();
        }
        return false;
      }

      var first_selection = true;
      if(_self.custom_queue.items.length == 0) _self.dashboard_list.updateItems(this.publications.levels);

      _self.custom_queue.items.forEach(
        item =>{
          levels.forEach( lvl =>{
            let new_item = document.createElement("tr");
            let new_id = item.id.replace(/(\S+:)\d+(-\d+)/, '$1' + lvl + '$2');

            new_item.id = new_id;
            new_item.name = item.name;
            new_item.className = "item even cp_item";
            new_item.setAttribute("c:drawn", true);

            _self.dashboard_list.items_list.appendChild(new_item);
            multipleSelector(new_item, first_selection);
            if(first_selection) first_selection = !first_selection;
          });
        }
      );
      
      return true;
    };
  }
  
/* Actions*/
  addToCustomQueue()
  {
    var _self = this;
    var listeners = [];
    var callback;
    callback = ()=>{
      console.log("Add to custom queue");

      var current_folder = window.location.hash.match(/\w+-(\w+-\w)/)[1];
      _self.dashboard_list.items_list.querySelectorAll(".selected")
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
          _self.custom_queue.push(item_details);
        }
      );
    }
    listeners.push( {"type":"click", "callback": callback } );
    this.context_menu.addFeature(this.add_to_queue, features.custom_queue, listeners);
  }

  openMultipleItems()
  {
    var _self = this;
    var listeners = [];
    var callback;

    callback = function()
    {
      _self.dashboard_list.updateItems(_self.publications.levels);              // quick fix for loading items 1st time
      
      if(_self.dashboard_list.items_list.length == 0) return;
      var selected_items = _self.dashboard_list.items_list.querySelectorAll("tr.selected");
      
      selected_items
        .forEach(function(item) 
        {
          if(item.type == ITEM_TYPE_COMPONENT || item.type == ITEM_TYPE_WEBPAGE)  // component
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
    this.context_menu.addFeature(this.multiple_open, features.open_items, listeners);
  }

/* Storage */
  getLocalStorage()
  {
    window.postMessage({action: "get_publishable_batches"}, "*");
  }
  
  backupSave()
  {
    // backup queue
    var queue = { items: this.custom_queue.items };
    localStorage.setItem('tdx_bk_queue', JSON.stringify(queue));
  }

  restoreBackup()
  {
    if(!localStorage.tdx_bk_queue) return;
    let data = JSON.parse(localStorage.tdx_bk_queue);
    var _self = this;

    data.items.forEach(
      item => this.custom_queue.push(item)
    );
  }

  lookPendingActions(){
    if(!localStorage.tdx_pending_actions) return;
    var p_actions = JSON.parse(localStorage.tdx_pending_actions);
    var p_action;

    while(p_action = p_actions.pop()){
      
      // select option and be sure that batches had been loaded
      let options = this.custom_queue.batch_sel.options;
      for(let i =0; i< options.length; i++){
        if(options[i].id == p_action.batch){
          options[i].selected = true;
          break;
        }
      }

      switch(p_action.action){
        case "publish":
          leftClick(this.custom_queue.publish_btn, false)
          break;
        case "unpublish":
          leftClick(this.custom_queue.unpublish_btn, false)
          break;
        default:
          break;
      }
    }
    localStorage.removeItem("tdx_pending_actions");
  }
// LOOK UP!

  addActions()
  {
    this.openMultipleItems();
    this.addToCustomQueue();
  }

  addObservers()
  {
    var _self = this;
    
    // Observer for loading of dashboard_list
    observerWrapper(
      this.dashboard_list.container, 
      { subtree: true, childList: true},
      function(){
        _self.dashboard_list.iframe = document.querySelector("#FilteredItemsList_frame_details");
        if(_self.dashboard_list.iframe != null)
        {
          _self.dashboard_list.iframe.addEventListener("load",function() 
          {
            if(this.contentWindow.document.body.innerText == "") return;
            _self.dashboard_list.updateItems(_self.publications.levels);

            // while(!_self.batches_loaded);
            _self.lookPendingActions();
          });
        }
      }
    );

    // Observer for loading of publications
    observerWrapper(
      this.publications.container, 
      { subtree: true, childList: true},
      function(e){
        let m_record = e[0];
        if(m_record.addedNodes < 2) return;
        window.postMessage({action: "init_levels"}, "*");
        this.disconnect();
      }
    );

    // Backup
    window.addEventListener("hashchange", e =>_self.backupSave());
    window.addEventListener("beforeunload", e =>_self.backupSave());
  }

  /**
   *  Add publishable custom batches to selector
   */
  updatePublishableBatches()
  {
    while (this.custom_queue.batch_sel.firstChild) {
      this.custom_queue.batch_sel.removeChild(this.custom_queue.batch_sel.firstChild);
    }

    this.publishable_batches.forEach(publishable_batch =>{
      var option = document.createElement("option");
      option.textContent = publishable_batch.name;
      option.id = publishable_batch.id;

      this.custom_queue.batch_sel.append(option);
    })
    
    this.batches_loaded = true;
  }

  /**
   * Handle and filter messages sent to this page
   */
  setMessageHandler()
  {
    window.addEventListener("message", event =>{ 
      if (event.source !== window) return;

      switch(event.data.action){
        case "publishable_batches":
          this.publishable_batches = event.data.data;
          this.updatePublishableBatches();
          break;
        case 'set_levels':
          this.publications.levels = event.data.data;
          console.log(this.publications.levels);
          break;
        default:
          break;
      }
    }, false);
  }
};
window._TDX = new Tridion_Ext();