//Click and mouse event capture: http://stackoverflow.com/a/3872560
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
      //hfref attribute similar to this: http://stackoverflow.com/a/2639218
      href_text = $(this).get(0).href
      link_metadata["href_text"] = href_text;
      surr_text = $(this).parent().text();
      link_metadata["surr_text"] = surr_text;
      curr_page = window.location.href;
      link_metadata["curr_page"] = curr_page;
      ref_page = document.referrer;
      link_metadata["ref_page"] = ref_page;
      link_metadata["curr_time"] = current_time;
      link_metadata["notes"] = "";

      if (link_text == undefined ||
          link_text == "" ||
          href_text == undefined ||
          href_text == "" ||
          surr_text == undefined ||
          surr_text == "" ||
          curr_page == undefined ||
          curr_page == "" ||
          ref_page == undefined ||
          ref_page == "" ) {
        alert("Some link fields were not populated, check the link in the Link Overview page (ctrl-shift-l)")
      }
      self.port.emit("link_entered", link_metadata);
    }
  });
});

//Keypress and click: http://stackoverflow.com/a/30444534
//Saving highlighted text: http://stackoverflow.com/a/15990778
$(function() {
  var ctrlPress = false;
  var leftMouseClick = false;

  //Keycode 83 below represents the 's' key
  $(document).on({
    keydown: function(e) {
      if(e.which == 83) {
        ctrlPress = true;
      }
      if (clickPress()) {
        saveHighlightedText();
        resetEventState();
      }
    },
    keyup: function(e) {
      if(e.which == 83) {
        ctrlPress = false;
      }
    },
    mousedown: function(e) {
      if (e.which == 1) {
        leftMouseClick = true;
      }
      if (clickPress()) {
        saveHighlightedText();
        resetEventState();
      }
    },
    mouseup: function(e) {
      if (e.which == 1) {
        leftMouseClick = false;
      }
    }
  });

  function clickPress() {
    return ctrlPress && leftMouseClick;
  }

  function resetEventState() {
    ctrlPress = false;
    leftMouseClick = false;
  }

  function saveHighlightedText() {
    var text = "";
    var link_metadata = {};
    if (window.getSelection) {
      text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
      text = document.selection.createRange().text;
    }

    link_metadata["link_text"] = text
    link_metadata["surr_text"] = window.getSelection().anchorNode.parentNode.innerHTML;
    link_metadata["href_text"] = "User Highlighted Selection";
    link_metadata["curr_page"] = window.location.href;
    link_metadata["ref_page"] = document.referrer;
    link_metadata["curr_time"] =  new Date($.now());
    link_metadata["notes"] = "";

    if (link_metadata["link_text"] == undefined ||
        link_metadata["link_text"] == "" ||
        link_metadata["surr_text"] == undefined ||
        link_metadata["surr_text"] == "" ||
        link_metadata["curr_page"] == undefined ||
        link_metadata["curr_page"] == "" ||
        link_metadata["ref_page"]== undefined ||
        link_metadata["ref_page"]== "" ) {
      alert("Some page fields were not populated, check the link in the Link Overview page (ctrl-shift-l)")
    }
    self.port.emit("save_highlighted_text", link_metadata);
  }
});
