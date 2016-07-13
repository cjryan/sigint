$('#set_topic').click(function(){
  var topic_name = $('#topic_name').val();
  console.log("before emit " + topic_name);
  self.port.emit("topic_entered", topic_name);
});
