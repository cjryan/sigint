self.port.on("send_link_pile", function sortLinks(link_pile) {
  var startlist = "<ul>";
  var midlist = "";
  var endlist = "</ul>";
  //link pile is coming in as JSON, parse it to manipulate
  var parsed_link_obj = JSON.parse(link_pile);
  var link_arr = parsed_link_obj.links;
  //Iterate through all the links, display the shortened title
  for(var i=0; i < link_arr.length; i++) {
      var link_text = link_arr[i].link_text;
      var spliced_title = link_arr[i].link_text.slice(0,10);
      var link_title = spliced_title + "...";
      var link_list_item = "<li><a href='#' class='link_ref'>" + link_title + "</a>";
      var hid_div = "<div class='link_meta' style='display: none;'><ul><li>link text: " + link_arr[i].link_text + "</li><li>href text: " + link_arr[i].href_text + "</li><li>surrounding text: " + link_arr[i].surr_text + "</li><li>current page: " + link_arr[i].curr_page + "</li><li>referring page: " + link_arr[i].ref_page + "</li><li>link capture time: " + link_arr[i].curr_time + "</li><li>current topic: " + link_arr[i].curr_topic + "</li><li><a href='#' class='edit' onclick='testfunction();'>edit</a></li></ul></div></li>"
      midlist = midlist + link_list_item + hid_div;
  }
  var full_list = startlist + midlist + endlist;
  //Hide the first text, as now we have links to show:
  $("#no_curr_links").css("display","none");
  $("#saved_pages").html(full_list);

  $('.link_ref').click(function() {
    //Target the sibling div of the clicked 'a' link and show it
    $(this).next().css({"display":"block"});
  });

  $('.edit').click(function() {
    console.log($(this).siblings.text());
    //var link_data = $(this).prev().html();
    //self.port.emit("link_annotation_data", link_data);
  });
});
