//Check for a current topic
//listen for response
self.port.on("curr_topic_contents", function getTopicContents(topic) {
  if (topic !== null) {
    //show the current topic panel to the user, if already set
    $("#topic_contents").html(topic);
    $("#set_current_topic").css("display","none");
    $("#current_topic").css("display","block");
    $("#new_topic").val('');
  }
});

//Set the current topic
$('#set_topic').click(function(){
  var topic_name = $('#topic_name').val();
  self.port.emit("topic_entered", topic_name);
});

$('#change_topic').click(function(){
  var change_topic_name = $('#new_topic').val();
  self.port.emit("topic_entered", change_topic_name);
});
