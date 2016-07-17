//Check for a current topic
//listen for response
self.port.on("curr_topic_contents", function getTopicContents(topic) {
  if (topic !== null) {
    //show the current topic panel to the user, if already set
    console.log("Current topic is..." + topic);
    $("#topic_contents").html(topic);
    $("#set_current_topic").css("display","none");
  }
});

//Set the current topic
$('#set_topic').click(function(){
  var topic_name = $('#topic_name').val();
  self.port.emit("topic_entered", topic_name);
});
