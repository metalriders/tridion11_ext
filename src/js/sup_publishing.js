var html = '<div class="sp_main" draggable="true">  <div>    <table>      <thead></thead>      <tbody></tbody>    </table>  </div>  <div>    <div class="sp_batch_sel">      <label>Select batch for publishing</label><select></select></div><input id="td11_unpublish_all" type="button" value="Unpublish">    <input id="td11_publish_all" type="button" value="Publish All">    <input id="td11_clear_all" type="button" value="Clear All">  </div></div>';
var container = document.createElement("div");
container.innerHTML = html;
console.log(document);

document.body.appendChild(container)