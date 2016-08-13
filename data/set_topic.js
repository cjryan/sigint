//Check for a current topic

$(document).ready(function() {
  $("#topic_name").focus();
  $("#new_topic").focus();
  $("#new_topic_method").focus();
  $(".select2-basic-single").select2();
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

function returnToTopic() {
  var selected = $("#select_existing_topic").find(':selected').text();
  //Create an array to simulate topic+description
  var selected_arr = [selected,""];
  self.port.emit("return_to_topic", selected_arr);
}

//Set the current topic
$('#set_topic').click(function(){
  setTopic();
});

$('#change_topic').click(function(){
  changeTopic();
});

$('#return_to_topic').click(function(){
  returnToTopic();
});

function createHistDropDown(hist_obj) {
  var options = "<option value=''></option>";
  var hist_arr = hist_obj["topic_history"];
  for (i = 0; i < hist_arr.length; i++) {
    for(var id in hist_arr[i]) {
      if (hist_arr[i].hasOwnProperty(id)) {
        var topic_name = hist_arr[i][id][0];
        var topic_desc = hist_arr[i][id][1];
        options = options + "<option value='"+ topic_name +"'>" + topic_name + "</option>";
      }
    }
  }
  return options;
}

//Select set Topic Method
$("#new_topic_method").change(function() {
  var entry_method = $(this).find(':selected').val();
  if (entry_method == "existing") {
    $("#create_new_topic").css("display","none");
    $("#return_to_existing_topic").css("display","block");
    self.port.emit("fetch_topic_history");
    self.port.on("send_hist_pile", function incomingHist(hist_obj) {
      var hist_select = createHistDropDown(hist_obj);
      $("#select_existing_topic").html(hist_select);
    });
  } else if (entry_method == "user_defined") {
    $("#create_new_topic").css("display","block");
    $("#return_to_existing_topic").css("display","none");
  }
});
