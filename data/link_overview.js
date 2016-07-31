self.port.on("send_link_pile", function sortLinks(link_pile) {

  //hasOwnProperty looks only for this object's properties, not the
  //built-in javascript prototype object metadata
  var page_html;
  for (var topic in link_pile) {
    if (link_pile.hasOwnProperty(topic)) {
      var topic_header = "<h1>" + topic + "</h1>";
      //console.log(topic_header);
      for (var page in link_pile[topic]) {
        if (link_pile[topic].hasOwnProperty(page)) {
          var page_header = "<h2>" + page + "</h2>";
          var list_start = "<ul>";
          var midlist = ""
          //console.log(page_header);
          var link_arr = link_pile[topic][page];
          for(var i=0; i < link_arr.length; i++) {
            var link_text = link_arr[i].link_text;
            //If the link text is empty or blank, supply the id instead
            if (link_text == "" || undefined) {
              link_text = link_arr[i].id;
            }
            var link_title = link_text;
            var link_list_item = "<li><a href='#' class='link_ref'>" +
            link_title + "</a>";
            var hid_div = "<div class='link_meta' style='display: none;'>" +
              "<ul><li id='link_id'>id: " + link_arr[i].id +
              "</li><li>link text: " + link_arr[i].link_text +
              "</li><li>href text: " + link_arr[i].href_text +
              "</li><li>surrounding text: " + link_arr[i].surr_text +
              "</li><li>current page: " +  link_arr[i].curr_page +
              "</li><li>referring page: " + link_arr[i].ref_page +
              "</li><li>link capture time: " + link_arr[i].curr_time +
              "</li><li>current topic: " + link_arr[i].curr_topic +
              "</li><li>notes: " +  link_arr[i].notes +
              "</li><li><a href='#' class='edit' onclick='testfunction();'>edit</a></li></ul></div></li><br /><br />";
              midlist = midlist + link_list_item + hid_div;
          }
          page_header = page_header + list_start + midlist + "</ul>";
        }
        topic_header = topic_header + page_header;
      }
    }
    page_html = page_html + topic_header;
  }

  //Hide the first text, as now we have links to show:
  $("#no_curr_links").css("display","none");
  $("#saved_pages").html(page_html);

  $('.link_ref').click(function() {
    //Target the sibling div of the clicked 'a' link and show it
    $(this).next().css({"display":"block"});
  });

  $('.edit').click(function() {
    var link_data = $(this).parent().parent().html();
    var sanitized_data = link_data.replace($(this)[0].outerHTML,'');
    self.port.emit("link_annotation_data", sanitized_data);
  });
});
