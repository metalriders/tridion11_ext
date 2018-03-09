'use strict';

/**
 * 
 * 
 * @class CustomQueue
 */
class CustomQueue{
  static get BASE_DOM_CUSTOM_QUEUE(){ return '<div class="sp_main"><span class="close">X</span><table cellpadding="0" cellspacing="0" border="0" style=""><thead class="tbl-header"><tr><th></th><th>name</th><th>type</th><th>Date</th></tr></thead><tbody class="tbl-content"></tbody></table><div><div class="sp_batch_sel"><label>Select batch for publishing</label><span class="custom-dropdown"><select></select></span><span class="refresh-custom-batches">&#x21bb;</span></div><input id="td11_unpublish_all" type="button" value="Unpublish"><input id="td11_publish_all" type="button" value="Publish All"><input id="td11_clear_all" type="button" value="Clear All"><input id="td11_clear_selected" type="button" value="Clear Selected"></div></div>' }
  
  get selectedBatch() { return this.batch_sel.options[this.batch_sel.selectedIndex].id; }
  get selectedItems() {
    let items = Array.from(this.items_list.querySelectorAll('tr'));

    return items.filter(item => { return item.querySelector('input[type="checkbox"]:checked')? item:null });
  }

  constructor(){
    this.items = [];
    
    this.container,
    this.items_list,
    this.batch_sel = undefined;
    
    // Buttons
    this.close_btn,
    this.publish_btn,
    this.unpublish_btn,
    this.clear_btn,
    this.clear_selected_btn,
    this.refresh_btn = undefined;

    this.init();
  }

  init(){
    this.container = document.createElement('div');
    this.container.innerHTML = CustomQueue.BASE_DOM_CUSTOM_QUEUE;
    this.container.style.display = 'none';
    document.body.appendChild(this.container);

    this.items_list = this.container.querySelector('tbody')
    this.batch_sel = this.container.querySelector('.sp_batch_sel select');
    this.close_btn = this.container.querySelector('.close');
    this.publish_btn = this.container.querySelector('#td11_publish_all');
    this.unpublish_btn = this.container.querySelector('#td11_unpublish_all');
    this.clear_btn = this.container.querySelector('#td11_clear_all');
    this.clear_selected_btn = this.container.querySelector('#td11_clear_selected');
    this.refresh_btn = this.container.querySelector('.refresh-custom-batches');

    this.initThumbnail();
    this.initListeners();
  }

  initThumbnail(){
    let toggle = document.createElement('div');
    toggle.id = 'CustomQueueBtn';
    toggle.className = 'button CustomQueue ribbonitem';
    toggle.title = 'Toggle Custom Queue';
    toggle.tabIndex = 1;
    toggle.style['user-select'] = 'none';
    toggle.setAttribute('c:controltype', 'Tridion.Controls.RibbonButton');
    toggle.innerHTML = '<div class="image">&nbsp;</div><div class="text">Custom<br>Queue</div>';

    document.querySelector('#PublishingQueueBtn').insertAdjacentElement( 'beforebegin', toggle );
    toggle.addEventListener('click',
      () => this.container.style.display = this.container.style.display === 'block'? 'none':'block'
    );
  }

  initListeners(){
    this.close_btn.addEventListener('click', () => this.container.style.display = 'none');

    // Update batches
    this.refresh_btn.addEventListener('click',
      () => {
        window.postMessage({action: 'get_publishable_batches'}, '*')
        this.refresh_btn.classList.add('batches-updated');
        setTimeout( () => this.refresh_btn.classList.remove('batches-updated'), 1000);
      }
    )

    // Remove all items from custom queue
    this.clear_btn.addEventListener('click', 
      (event, tbody = this.items_list) =>
      {
        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
        this.items = [];
      }
    );

    // Remove all selected items from custom queue
    this.clear_selected_btn.addEventListener('click', 
      (event, selectedItems = this.selectedItems) =>
      {
        selectedItems.forEach( item => {
          item.remove();
          this.items.filter((i,k)=> { if (i.id === item.id) this.items.removeAt(k) });
        });
      }
    );
  }

  push(item){
    let row, check, name, type, last_mod;
    row = document.createElement('tr');
    check = document.createElement('td');
    name = document.createElement('td');
    type = document.createElement('td');
    last_mod = document.createElement('td');

    row.id = item.id;
    name.textContent = item.name;
    type.textContent = item.type;
    last_mod.textContent = item.last_mod;

    let cbx = document.createElement('input');
    cbx.type = 'checkbox';
    check.appendChild(cbx);

    row.appendChild(check);
    row.appendChild(name);
    row.appendChild(type);
    row.appendChild(last_mod);

    // row.onclick = () => row.remove();
    this.items_list.appendChild(row);
    this.items.push(item);
  }
};