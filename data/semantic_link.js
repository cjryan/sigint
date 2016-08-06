current_active_tab = "";
self.port.on("current_tab_pile", function receiveTabs(tab_pile) {
  options = ""
  //array length -1, due to active tab as last element
  for(var i = 0; i < tab_pile.length - 1; i++) {
    var tab_id = Object.keys(tab_pile[i])[0];
    var tab_url = tab_pile[i][tab_id]
    //TODO: if url includes resource://, ignore it
    options += "<option value='"+ tab_id +"'>" + tab_url + "</option>";
  }
  current_active_tab = tab_pile[tab_pile.length - 1];
  $('#tab_select').html(options);
});

$(document).ready(function() {
  var tab_val = "";
  $(".select2-basic-single").select2();
  //TODO: create an alert if no change
  $("#tab_select").change(function() {
    tab_url = $(this).find(':selected').text();
  });
  $("#semantic_form_submit").click(function() {
    if (current_active_tab == tab_url) {
      if (confirm("The tab you are attempting to bridge is the same as the active tab, you probably want another. Continue anyway?")) {
        link_metadata = {};

        link_metadata["link_text"] = "";
        link_metadata["surr_text"] = "";
        link_metadata["href_text"] = "Semantic Link";
        link_metadata["curr_page"] = current_active_tab;
        link_metadata["ref_page"] = tab_url;
        link_metadata["curr_time"] =  new Date($.now());
        link_metadata["notes"] = "";

        self.port.emit("semantic_link_ref", link_metadata);
      }
    }
  });
});

self.port.on("capture_alert", function alertUser() {
  $("#alert_box").html("Semantic link captured.");
});

