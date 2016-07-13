var self = require("sdk/self");
var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
//Add low level FF util to write to file
const {Cu} = require("chrome");
// To read & write content to file
const {TextDecoder, TextEncoder, OS} = Cu.import("resource://gre/modules/osfile.jsm", {});
// Define keyboard shortcuts for showing and hiding a custom panel.
var { Hotkey } = require("sdk/hotkeys");

var set_topic_panel = require("sdk/panel").Panel({
  width: 180,
  height: 180,
  contentURL: data.url("form.html"),
  contentScriptFile: [data.url("jquery-3.0.0.min.js"), data.url("form.js")]
});

set_topic_panel.port.on("topic_entered", function(text) {
  console.log("after emit " + text);
  set_topic_panel.hide();
});

//Modify the page to allow jquery, and link identification
pageMod.PageMod({
  include: "*",
  contentScriptFile: [data.url("jquery-3.0.0.min.js"), data.url("link_click.js")]
});

var showHotKey = Hotkey({
  combo: "accel-shift-o",
  onPress: function() {
    set_topic_panel.show({
      //This will show the panel under the addon button
      position: button
    });
  }
});

var hideHotKey = Hotkey({
  combo: "accel-alt-shift-o",
  onPress: function() {
    set_topic_panel.close();
  }
});

var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");

var button = buttons.ActionButton({
  id: "mozilla-link",
  label: "Visit Mozilla",
  icon: {
    "16": "./icon-16.png",
    "32": "./icon-32.png",
  },
  onClick: handleClick
});

function handleClick(state) {
  tabs.open("http://www.mozilla.org/");
}

var writeHotKey = Hotkey({
  combo: "accel-shift-w",
  onPress: function() {
    testWrite();
    console.log("wrote file");
  }
});

function testWrite() {
//Write to a file test
let encoder = new TextEncoder();                                   // This encoder can be reused for several writes
let array = encoder.encode("This is some text");                   // Convert the text to an array
let promise = OS.File.writeAtomic("file.txt", array,               // Write the array atomically to "file.txt", using as temporary
    {tmpPath: "file.txt.tmp", noOverwrite: true});                 // buffer "file.txt.tmp".
}

// a dummy function, to show how tests work.
// to see how to test this function, look at test/test-index.js
function dummy(text, callback) {
  callback(text);
}

exports.dummy = dummy;
