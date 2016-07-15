var self = require("sdk/self");
var data = require("sdk/self").data;
var buttons = require('sdk/ui/button/action');
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
  topicWrite(text);
  set_topic_panel.hide();
});

/* From MDN docs on port communication:
https://developer.mozilla.org/en-US/Add-ons/SDK/Guides/Content_Scripts/using_port#Accessing_port_in_the_Add-on_Script
So page-mod does not integrate the worker API directly: instead, each time a content script is attached to a page, the worker associated with the page is supplied to the page-mod in its onAttach function. By supplying a target for this function in the page-mod's constructor you can register to receive messages from the content script, and take a reference to the worker so as to emit messages to the content script.
*/
//Modify the page to allow jquery, and link identification
var pgmod = pageMod.PageMod({
  include: "*",
  contentScriptFile: [data.url("jquery-3.0.0.min.js"), data.url("link_click.js")],
  onAttach: function(worker) {
    worker.port.on("link_entered", function(link) {
      linkMotherlodeWrite(link);
    });
  }
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

var button = buttons.ActionButton({
  id: "mozilla-link",
  label: "Visit Mozilla",
  icon: {
    "16": "./icon-16.png",
    "32": "./icon-32.png",
  },
  onClick: function() { 
    set_topic_panel.show({
      position: button
    });
  }
});

//OS.File.exists()
//mkdir if doesn't exist
//OS.File.makeDir() --> ignoreExisting flag
//create file if doesn't exist

//read file
function readFile(input_file) {
  var output;
  // This decoder can be reused for several reads
  let decoder = new TextDecoder();          
  // Read the complete file as an array
  let promise = OS.File.read(input_file);   
  promise = promise.then(
    function onSuccess(array) {
      // Convert this array to a text
      output = decoder.decode(array);
      console.log("current topic read decode value: " + output);
      return output; 
  });
  console.log("current topic read return output value: " + output);
}

function linkMotherlodeWrite(link) {
  console.log("link motherlode");
  //TODO: add error checking to all of this!!

  //TODO: what happens when a file already exists? open as append?
  //https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/OSFile.jsm/OS.File_for_the_main_thread#Example_Append_to_File

  //TODO: Read in current topic, if exists. Otherwise, throw error to set current topic; maybe throw up a panel alert?
  var profile_dir = OS.Constants.Path.profileDir;
  console.log("after profile dir " + profile_dir);
  var current_topic_path = OS.Path.join(profile_dir, 'current_topic.json');
  console.log("after current_topic_path: " + current_topic_path);
  var read_output = "";
  read_output = readFile(current_topic_path);
  console.log("current topic link writer: " + read_output);

  link["curr_topic"] = read_output;

  json_out = JSON.stringify(link)

  //Write to a file test
  // This encoder can be reused for several writes
  let encoder = new TextEncoder(); 
  // Get user's profile directory
  var link_motherlode_file = 'link_motherlode.json';
  var link_motherlode_tmp_file = link_motherlode_file + '.tmp';
  let link_motherlode_file_path = OS.Path.join(profile_dir, link_motherlode_file); 
  let link_motherlode_file_tmp_path = OS.Path.join(profile_dir, link_motherlode_tmp_file); 
  // Convert the text to an array
  let array = encoder.encode(json_out);                   
  // Write the array atomically to "file.txt", using as temporary
  // buffer "file.txt.tmp".
  let promise = OS.File.writeAtomic(link_motherlode_file_path, array,               
      {tmpPath: link_motherlode_file_tmp_path, noOverwrite: true});
}

//create topic history
//function topicHistWrite()

function topicWrite(topic) {
  //Write to a file test
  // This encoder can be reused for several writes
  let encoder = new TextEncoder(); 
  // Get user's profile directory
  var profile_dir = OS.Constants.Path.profileDir;
  var current_topic_file = 'current_topic.json';
  var current_topic_tmp_file = current_topic_file + '.tmp';
  let current_topic_file_path = OS.Path.join(profile_dir, current_topic_file); 
  let current_topic_file_tmp_path = OS.Path.join(profile_dir, current_topic_tmp_file); 
  // Convert the text to an array
  let array = encoder.encode(topic);                   
  // Write the array atomically to "file.txt", using as temporary
  // buffer "file.txt.tmp".
  let promise = OS.File.writeAtomic(current_topic_file_path, array,               
      {tmpPath: current_topic_file_tmp_path, noOverwrite: true});
}

// a dummy function, to show how tests work.
// to see how to test this function, look at test/test-index.js
function dummy(text, callback) {
  callback(text);
}

exports.dummy = dummy;
