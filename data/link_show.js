self.port.on("link_data", function editForm(data) {
  $('#link_edit_form').html(data);
});
