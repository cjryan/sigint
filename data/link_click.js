//http://stackoverflow.com/questions/3872498/jquery-how-to-catch-keydown-mouse-click-event/3872560#3872560
$(function() {
  $("a").click(function(event) {
    //create an object to store the link data
    var link_metadata = {};

    //jquery click event can use altKey, ctrlKey, key, keyCode, metaKey, shiftKey
    //https://api.jquery.com/category/events/event-object/
    if (event.altKey && event.ctrlKey && event.shiftKey) {
      console.log("works.");
    }
    else if (event.altKey && event.ctrlKey) {
      //Add checking logic, if var is blank, add empty strings for json
      current_time = new Date($.now());
      link_text = $(this).text();
      link_metadata["link_text"] = link_text;
      href_text = $(this).attr("href");
      link_metadata["href_text"] = href_text;
      surr_text = $(this).parent().text();
      link_metadata["surr_text"] = surr_text;
      curr_page = window.location.href;
      link_metadata["curr_page"] = curr_page;
      ref_page = document.referrer;
      link_metadata["ref_page"] = ref_page;
      link_metadata["curr_time"] = current_time;
    }
    self.port.emit("link_entered", link_metadata);
  });
});
