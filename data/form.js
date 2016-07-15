$('#set_topic').click(function(){
  var topic_name = $('#topic_name').val();
  self.port.emit("topic_entered", topic_name);
});
