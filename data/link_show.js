self.port.on("link_data", function editForm(data) {
  var incoming_data = data;
  mod_data = incoming_data.replace('<li></li>','<b>Add Notes</b><textarea id="link_notes"></textarea><br /><button id="link_submit">Save</button>')
  $('#link_edit_form').html(mod_data);

  $('#link_submit').click(function() {
    var notes = $('#link_notes').val();
    var raw_id = $('#link_id').html();
    var id = parseInt(raw_id.replace(/id:\s+/,''));
    var mod_link_data = {};
    mod_link_data["notes"] = notes;
    mod_link_data["id"] = id;
    self.port.emit("save_link_data", mod_link_data);
  });
});
