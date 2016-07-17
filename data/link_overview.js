//TODO: show first 10 chars or so of link name, then elipsis
//
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
			var link_list_item = "<li><a href='#'>" + link_title + "</a></li>";
			midlist = midlist + link_list_item;
	}
  var full_list = startlist + midlist + endlist;
	//Hide the first text, as now we have links to show:
  $("#no_curr_links").css("display","none"); 
  $("#saved_pages").html(full_list);
});
