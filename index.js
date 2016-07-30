var self = require("sdk/self");
var data = require("sdk/self").data;
var buttons = require('sdk/ui/button/action');
var pageMod = require("sdk/page-mod");
var tabs = require("sdk/tabs");
var { Hotkey } = require("sdk/hotkeys");
//Add low level FF util to write to file
const {Cu} = require("chrome");
// To read & write content to file
const {TextDecoder, TextEncoder, OS} = Cu.import("resource://gre/modules/osfile.jsm", {});
var base64 = require("sdk/base64");

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

var link_show_panel = require("sdk/panel").Panel({
  width: 400,
  height: 400,
  contentURL: data.url("link_show.html"),
  contentScriptFile: [data.url("jquery-3.0.0.min.js"), data.url("link_show.js")],
  onShow: showLink
});

link_show_panel.port.on("save_link_data", function(mod_link_data) {
    link_show_panel.hide();
    writeLinkEdits(mod_link_data);
});

/* From MDN docs on port communication:
https://developer.mozilla.org/en-US/Add-ons/SDK/Guides/Content_Scripts/using_port#Accessing_port_in_the_Add-on_Script
So page-mod does not integrate the worker API directly: instead, each time a content script is attached to a page, the worker associated with the page is supplied to the page-mod in its onAttach function. By supplying a target for this function in the page-mod's constructor you can register to receive messages from the content script, and take a reference to the worker so as to emit messages to the content script.
*/
//Modify the page to allow jquery, and link identification
var pgmod = pageMod.PageMod({
  include: "*",
  contentScriptFile: [data.url("jquery-3.0.0.min.js"), data.url("link_click.js")],
  //Load content scripts once all the content (DOM, JS, CSS, images) has been loaded, at the time the window.onload event fires
  contentScriptWhen: "end",
  onAttach: function(worker) {
    worker.port.on("link_entered", function(link) {
      linkMotherlodeCapture(link);
      //Update Badge to indicate successful link click
      button.badge += 1;
    });
  }
});

//This functionality below is documented here:
//http://stackoverflow.com/questions/32046399/firefox-jpm-emit-to-tab-from-outside-the-tab-call/32047579#32047579

var link_list_worker;

lnkOverviewPgMod = pageMod.PageMod({
  include: self.data.url("link_overview.html"),
  contentScriptFile: [data.url("jquery-3.0.0.min.js"),data.url("link_overview.js")],
  onAttach: function onAttach(worker) {
    link_list_worker = worker;
    getCurrentLinks();
    worker.port.on("link_annotation_data", function(data) {
      link_show_panel.show();
      link_show_panel.port.emit("link_data", data);
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

var showLinkOverHotKey = Hotkey({
  combo: "accel-shift-l",
  onPress: function() {
    tabs.open(self.data.url("link_overview.html"));
  }
});

var button = buttons.ActionButton({
  id: "sigint-main-button",
  label: "sigint",
  icon: {
    "16": "./icon-16.png",
    "32": "./icon-32.png",
  },
  onClick: function() {
    set_topic_panel.show({
      position: button
    });
  },
  badge: 0
});

//read file
function readFile(input_file) {
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
        //add a unique link identifier
        rand_num = Math.random();
        var id = base64.encode(rand_num.toString());
        link["id"] = id;
        link["curr_topic"] = current_topic;
        var json_out = link;
        var link_motherlode_file_path = pathFinder('link_motherlode_json');
        linkWriter(json_out, link_motherlode_file_path);
      });
}

//Write current topic
function topicWrite(topic) {
  var current_topic_path = pathFinder('current_topic_json');
  writeFile(topic, current_topic_path);
  topicHistWrite(topic);
}

//Check to see if a topic is currently set
function checkSetTopic() {
  //Wait for the panel to open
  //TODO: error check if file actually exists
  var check_current_topic_path = pathFinder('current_topic_json');
  var current_topic_promise = readFile(check_current_topic_path);
  current_topic_promise.then(
      function onFulfill(read_topic) {
        set_topic_panel.port.emit("curr_topic_contents", read_topic);
  });
}

//create topic history
function topicHistWrite(topic_to_archive) {
  //First, check if a topic history file already exists
  var path = pathFinder('topic_hist_json');
  let hist_exist_promise= OS.File.exists(path);
  hist_exist_promise.then(
    function onFulfill(exist) {
      if (exist) {
        //if it exists, get existing file, parse as json
        var hist_read_promise = readFile(path);
        hist_read_promise.then(
          function onFulfill(existing_hist){
            var hist_obj = JSON.parse(existing_hist);
            //hist_obj is the name of the parsed data object,
            //topic_history is the name of the json array created in the skeleton
            hist_obj.topic_history.push(topic_to_archive);
            var new_hist_commit = JSON.stringify(hist_obj);
            writeFile(new_hist_commit, path);
        });
      } else {
        console.log("No topic history file found, dishing one up now...");
        var skeleton = '{"topic_history":["' + topic_to_archive + '"]}'
        writeFile(skeleton, path);
      }
    },
    function onReject(hist_write_reject) {
      console.warn('Could not find file: ' + hist_write_reject);
    });
}

//Return a list of links, to be displayed to the user
function getCurrentLinks() {
  motherlode_path = pathFinder('link_motherlode_json');
  let link_exist_promise = OS.File.exists(motherlode_path);
  link_exist_promise = link_exist_promise.then(
    function onFulfill(moLoExist) {
      if (moLoExist) {
        var link_output_promise = readFile(motherlode_path);
        link_output_promise.then(
          function onFulfill(link_pile){
            var all_links_obj = JSON.parse(link_pile);
            link_list_worker.port.emit("send_link_pile", all_links_obj);
          });
      } else {
        //TODO: Create a user-visible dialog that tells the user
        //to create a topic and get going.
        console.log("link motherlode not found.");
      }
    },
    function onReject(reject_link_info) {
      console.warn('Could not get current links: ' + reject_link_info);
    });
}

//Found at
//http://stackoverflow.com/questions/12462318/find-a-value-in-an-array-of-objects-in-javascript/12462387#12462387
//TODO: Add error checking here, { else } should fail
function linkIdSearch(Key, linkArray) {
  for (var i=0; i < linkArray.length; i++) {
    if (linkArray[i].id === Key) {
      return linkArray[i];
    }
  }
}

function getLinkById(id) {
//TODO:: Replace this whole block with getCurrentLinks, as it's identical
  motherlode_path = pathFinder('link_motherlode_json');
  var link_output_promise = readFile(motherlode_path);
  let indiv_link_stanza_promise = link_output_promise.then(
    function onFulfill(link_pile) {
      var all_links_obj = JSON.parse(link_pile);
      var indiv_link_stanza = linkIdSearch(id, all_links_obj["links"])
      return indiv_link_stanza;
    },
    function onReject(reject_link_info) {
      console.warn('Could not get current links: ' + reject_link_info);
    });
    return indiv_link_stanza_promise;
}

function writeLinkEdits(edits) {
  var notes = edits["notes"];
  var id = edits["id"];
  let link_stanza_promise = getLinkById(id);
  link_stanza_promise.then(
    function onFulfill(stanza) {
      stanza["notes"] = notes;
      //Read in the linkmotherlode, find the stanza to replace,
      //remove it from the link array, add the new stanza in it's place,
      //write the modified file.
      motherlode_path = pathFinder('link_motherlode_json');
      var all_link_promise = readFile(motherlode_path);
      all_link_promise.then(
        function onFulfill(links) {
          var all_links_obj = JSON.parse(links);
          var linkArray = all_links_obj["links"];
          var linkIndex;
          for (var i=0; i < linkArray.length; i++) {
            if (linkArray[i].id === id) {
              linkIndex = linkArray.indexOf(linkArray[i]);
            }
          }
          linkArray[linkIndex] = stanza;
          var mod_link_obj = {"links":linkArray};
          mod_link_obj = JSON.stringify(mod_link_obj);
          writeFile(mod_link_obj, motherlode_path);
        },
        function onReject(reject_link_info) {
          console.warn('Could not read file: ' + reject_link_info);
        });
    },
    function onReject(reject_stanza_info) {
      console.warn("Could not return stanza.");
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
