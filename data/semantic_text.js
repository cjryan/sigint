//Keypress and click: http://stackoverflow.com/a/30444534
//Saving highlighted text: http://stackoverflow.com/a/15990778
$(function() {
  var ctrlPress = false;
  var leftMouseClick = false;

  //Keycode 66 below represents the 'b' key
  $(document).on({
    keydown: function(e) {
      if(e.which == 66) {
        ctrlPress = true;
      }
      if (clickPress()) {
        saveHighlightedText();
        resetEventState();
      }
    },
    keyup: function(e) {
      if(e.which == 66) {
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
    self.port.emit("semantic_highlighted_text", text);
  }
});
