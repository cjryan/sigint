var self = require("sdk/self");

//https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/hotkeys
// Define keyboard shortcuts for showing and hiding a custom panel.
var { Hotkey } = require("sdk/hotkeys");

var showHotKey = Hotkey({
  combo: "accel-shift-o",
  onPress: function() {
    console.log("works.");
    showMyPanel();
  }
});
var hideHotKey = Hotkey({
  combo: "accel-alt-shift-o",
  onPress: function() {
    hideMyPanel();
  }
});

// a dummy function, to show how tests work.
// to see how to test this function, look at test/test-index.js
function dummy(text, callback) {
  callback(text);
}

exports.dummy = dummy;
