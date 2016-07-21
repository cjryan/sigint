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
  contentURL: data.url("set_topic.html"),
  contentScriptFile: [data.url("jquery-3.0.0.min.js"), data.url("set_topic.js")],
  //Check if a topic is currently set or not
  onShow: checkSetTopic
});

set_topic_panel.port.on("topic_entered", function(text) {
  topicWrite(text);
  set_topic_panel.hide();
});

var link_overview_panel = require("sdk/panel").Panel({
  width: 400,
  height: 200,
  contentURL: data.url("link_overview.html"),
  contentScriptFile: [data.url("jquery-3.0.0.min.js"), data.url("link_overview.js")],
  onShow: getCurrentLinks
});

link_overview_panel.port.on("link_annotation_data", function(data) {
  //get data here and write it to the url?
  link_show_panel.show();
  link_show_panel.port.emit("link_data", data);
});

var link_show_panel = require("sdk/panel").Panel({
  width: 180,
  height: 180,
  contentURL: data.url("link_show.html"),
  contentScriptFile: [data.url("jquery-3.0.0.min.js"), data.url("link_show.js")],
  onShow: showLink
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
      linkMotherlodeCapture(link);
    });
  }
});


/* Set Topic Hotkeys*/
var showSetTopicHotKey = Hotkey({
  combo: "accel-shift-o",
  onPress: function() {
    set_topic_panel.show({
      //This will show the panel under the addon button
      position: button
    });
  }
});

var hideShowTopicHotKey = Hotkey({
  combo: "accel-alt-shift-o",
  onPress: function() {
    set_topic_panel.hide();
  }
});

/* Link Overview Hotkeys*/
var showLinkOverHotKey = Hotkey({
  combo: "accel-shift-l",
  onPress: function() {
    link_overview_panel.show({
      position: button
    });
  }
});

var hideLinkOverHotKey = Hotkey({
  combo: "accel-alt-shift-l",
  onPress: function() {
    link_overview_panel.hide();
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
      return output;
    },
    function onReject(read_rejection) {
      //TODO: how to make this user-visible in the browser?
      //will console.log be visible to the end user of the addon?
      console.warn('Could not read file due to: ', read_rejection);
    }
  );
  return promise
}

//write file
function writeFile(data, path) {
  // This encoder can be reused for several writes
  let encoder = new TextEncoder();
  // Convert the text to an array
  let array = encoder.encode(data);
  // Write the array atomically to "file.txt", using as temporary
  // buffer "file.txt.tmp".
  var tmp_path =  path + '.tmp';
  let promise = OS.File.writeAtomic(path, array,
      {tmpPath: tmp_path, noOverwrite: false});
}

function linkWriter(data, path) {
  //First, check if a links motherlode file exists
  let link_exist_promise = OS.File.exists(path);
  link_exist_promise.then(
    function onFulfill(exist) {
      if (exist) {
        //if it exists, get existing link file, parse as json
        var linkfile_promise = readFile(path);
        linkfile_promise.then(
          function onFulfill(existing_links){
            var links_obj = JSON.parse(existing_links);
            //links_obj is the name of the parsed data object,
            //links is the name of the json array created in the skeleton
            links_obj.links.push(data);
            var new_links_commit = JSON.stringify(links_obj);
            writeFile(new_links_commit, path);
            console.log(links_obj);
        });
      } else {
        console.log("No link motherlode file found, dishing one up now...");
        var first_link = JSON.stringify(data);
        var skeleton = '{"links":[' + first_link + ']}'
        console.log(skeleton);
        writeFile(skeleton, path);
      }
    },
    function onReject(link_write_reject) {
      console.warn('Could not find file: ' + link_write_reject);
    }
  );
}

//default addon path
function pathFinder(filename) {
  // Get user's profile directory
  var profile_dir = OS.Constants.Path.profileDir;
  var full_path = OS.Path.join(profile_dir, filename);
  return full_path;
}

function linkMotherlodeCapture(link) {
  //TODO: add error checking to all of this!!

  //TODO: what happens when a file already exists? open as append?
  //https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/OSFile.jsm/OS.File_for_the_main_thread#Example_Append_to_File

  //TODO: Read in current topic, if exists. Otherwise, throw error to set current topic; maybe throw up a panel alert?
  var current_topic_path = pathFinder('current_topic_json');
  var read_output_promise = readFile(current_topic_path);
  read_output_promise.then(
      function onFulfill(current_topic){
        link["curr_topic"] = current_topic;
        var json_out = link;
        var link_motherlode_file_path = pathFinder('link_motherlode_json');
        linkWriter(json_out, link_motherlode_file_path);
      });
}

//create topic history
//function topicHistWrite()

function topicWrite(topic) {
  var current_topic_path = pathFinder('current_topic_json');
  writeFile(topic, current_topic_path);
}

//Check to see if a topic is currently set
function checkSetTopic() {
  console.log("Checking for topic...");
  //Wait for the panel to open
  //TODO: error check if file actually exists
  var check_current_topic_path = pathFinder('current_topic_json');
  var current_topic_promise = readFile(check_current_topic_path);
  current_topic_promise.then(
      function onFulfill(read_topic) {
        set_topic_panel.port.emit("curr_topic_contents", read_topic);
        console.log("Sent topic back...");
  });
}

//Return a list of links, to be displayed to the user
function getCurrentLinks() {
  motherlode_path = pathFinder('link_motherlode_json');
  let link_exist_promise = OS.File.exists(motherlode_path);
  link_exist_promise.then(
    function onFulfill(moLoExist) {
      if (moLoExist) {
        var link_output_promise = readFile(motherlode_path);
        link_output_promise.then(
          function onFulfill(link_pile){
            var all_links_obj = JSON.parse(link_pile);
              link_overview_panel.port.emit("send_link_pile", link_pile);
          });
      } else {
        //TODO: Create a user-visible dialog that tells the user
        //to create a topic and get going.
        console.log("link motherlode not found.");
      }
    });
}

function showLink() {
}

// a dummy function, to show how tests work.
// to see how to test this function, look at test/test-index.js
function dummy(text, callback) {
  callback(text);
}

exports.dummy = dummy;
