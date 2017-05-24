let custom_queue = '<div class="sp_main"><table cellpadding="0" cellspacing="0" border="0" style=""><thead class="tbl-header"><tr><th>name</th><th>type</th><th>Date</th></tr></thead><tbody class="tbl-content"></tbody></table><div><div class="sp_batch_sel"><label>Select batch for publishing</label><span class="custom-dropdown"><select></select></span></div><input id="td11_unpublish_all" type="button" value="Unpublish"><input id="td11_publish_all" type="button" value="Publish All"><input id="td11_clear_all" type="button" value="Clear All"></div></div>';

var container = document.createElement("div");
container.innerHTML = custom_queue;
container.style.display = "none";

document.body.appendChild(container);