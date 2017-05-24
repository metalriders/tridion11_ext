let custom_queue = '<div class="sp_main"><span class="close">X</span><table cellpadding="0" cellspacing="0" border="0" style=""><thead class="tbl-header"><tr><th>name</th><th>type</th><th>Date</th></tr></thead><tbody class="tbl-content"></tbody></table><div><div class="sp_batch_sel"><label>Select batch for publishing</label><span class="custom-dropdown"><select></select></span><span class="refresh-custom-batches">&#x21bb;</span></div><input id="td11_unpublish_all" type="button" value="Unpublish"><input id="td11_publish_all" type="button" value="Publish All"><input id="td11_clear_all" type="button" value="Clear All"></div></div>';

var container = document.createElement("div");
container.innerHTML = custom_queue;
container.style.display = "none";
document.body.appendChild(container);

let close_btn = document.querySelector(".sp_main .close");
close_btn.addEventListener(
  "click",
  () => container.style.display = "none"
);

let refresh_btn = document.querySelector(".sp_main .refresh-custom-batches");
refresh_btn.addEventListener(
  "click",
  () => {
    window.postMessage({action: "get_publishable_batches"}, "*")
    refresh_btn.classList.add("batches-updated");
    setTimeout( () => refresh_btn.classList.remove("batches-updated"), 1000);
  }
)