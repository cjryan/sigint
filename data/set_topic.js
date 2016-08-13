//Check for a current topic

$(document).ready(function() {
  $("#topic_name").focus();
  $("#new_topic").focus();
});

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

function setTopic() {
  var topic_name = $("#topic_name").val();
  var topic_description = $("#topic_description").val();
  var topic_arr = [topic_name, topic_description];
  if (!topic_name || 0 === topic_name.length) {
    $("#topic_name").css("border-color","red");
  } else {
    self.port.emit("topic_entered", topic_arr);
  }
}

function changeTopic() {
  var change_topic_name = $("#new_topic").val();
  var change_topic_description = $("#change_topic_description").val();
  var change_topic_arr = [change_topic_name, change_topic_description];
  if (!change_topic_name || 0 === change_topic_name.length) {
    $("#new_topic").css("border-color","red");
  } else {
    self.port.emit("topic_entered", change_topic_arr);
  }
}

//Set the current topic
$('#set_topic').click(function(){
  setTopic();
});

$('#change_topic').click(function(){
  changeTopic();
});
