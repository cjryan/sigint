self.port.on("send_hist_pile", function sortTopics(hist_pile) {
  //hist_pile["topic_history"][1]["MC45ODA4Mzk5MDYwMjY5NDU3"]
  topic_arr = hist_pile["topic_history"];
  var inner_html = "";
  for (var i = 0; i < topic_arr.length; i++) {
    for(var id in topic_arr[i]) {
      if (topic_arr[i].hasOwnProperty(id)) {
        var topic_name = topic_arr[i][id][0];
        var topic_desc = topic_arr[i][id][1];
        inner_html = inner_html + "<li>" + topic_name + "</li>" +
          "<ul><li>" + topic_desc + "</li></ul>";
      }
    }
  }
  var full_html = "<ul>" + inner_html + "</ul>";
  $("#saved_topics").html(full_html);
  $("#no_topics").css("display","none");
  $("#saved_topics").css("display","block");

});
