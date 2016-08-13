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


/* Generate a working directory for the add-on
 * so as not to make a mess of the user's profile directory
 */

function createWorkingDirectory() {
  var profile_dir = OS.Constants.Path.profileDir;
  //var addon_path = OS.Path.join(profile_dir + "/sigint");
  var addon_path = OS.Path.join(profile_dir + "/sigint");
  make_dir_promise = OS.File.makeDir(addon_path, { ignoreExisting: false });
  make_dir_promise.then(
      function onFulfill(create_dir) {
        console.log("Successfully created: " + addon_path);
      },
      function onReject(reject_dir) {
        console.warn("Could not create: " + reject_dir);
      });
}

createWorkingDirectory();

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
    worker.port.on("save_highlighted_text", function(text) {
      linkMotherlodeCapture(text);
      //Update Badge to indicate successful link click
      button.badge += 1;
    });
  }
});

//This functionality below is documented here:
//http://stackoverflow.com/questions/32046399/firefox-jpm-emit-to-tab-from-outside-the-tab-call/32047579#32047579

var set_topic_worker;
setTopicPgMod = pageMod.PageMod({
  include: data.url("set_topic.html"),
  contentStyleFile: data.url("select2.min.css"),
  contentScriptFile: [data.url("jquery-3.0.0.min.js"),data.url("select2.full.min.js"),data.url("set_topic.js")],
  onAttach: function onAttach(worker) {
    set_topic_worker = worker;
    checkSetTopic();
    worker.port.on("topic_entered", function(topic_arr) {
      topicWrite(topic_arr);
      topicHistWrite(topic_arr);
      worker.tab.close();
    });
    worker.port.on("fetch_topic_history", function() {
      showTopicHistory(worker);
    });
    worker.port.on("return_to_topic", function(topic_arr) {
      topicWrite(topic_arr);
      worker.tab.close();
    });
  }
});

var link_list_worker;

lnkOverviewPgMod = pageMod.PageMod({
  include: data.url("link_overview.html"),
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

var topic_graph_worker;

graphPgMod = pageMod.PageMod({
  include: data.url("link_graph.html"),
  contentScriptFile: [data.url("jquery-3.0.0.min.js"),data.url("link_graph.js"),data.url("d3.v3.min.js")],
  onAttach: function onAttach(worker) {
    topic_graph_worker = worker;
    graphRoutes();
  }
});

var semantic_link_worker;
var active_tab = "";

semanticPgMod = pageMod.PageMod({
  include: data.url("semantic_link.html"),
  contentStyleFile: data.url("select2.min.css"),
  contentScriptFile: [data.url("jquery-3.0.0.min.js"),data.url("select2.full.min.js"),data.url("semantic_link.js")],
  onAttach: function onAttach(worker) {
    semantic_link_worker = worker;
    createSemanticBridge();

    /* When the 'Text' button is clicked in the semantic bridge page,
    * the following is executed: a new page is opened, which contains
    * the url of the bridge reference. A user then selects text to be
    * associated with the bridge page, and the resulting link is saved.
    */
    worker.port.on("retrieve_text", function(tab_url) {
    var captured_text = "";
    tabs.open({
      url: tab_url,
      onReady: function(tab) {
        var text_worker = tab.attach({
          contentScript: 'document.body.style.border = "5px solid red";',
          contentScriptFile: [data.url("jquery-3.0.0.min.js"),data.url("semantic_text.js")]
        });
          text_worker.port.on("semantic_highlighted_text", function(text) {
            worker.port.emit("send_back_text", text);
          });
        }
      });
    });

    // Save the semantic link once the Save button is pressed.
    worker.port.on("semantic_link_ref", function(semantic_data) {
      linkMotherlodeCapture(semantic_data);
      worker.port.emit("capture_alert");
      button.badge += 1;
    });
  }
});

topicHistPgMod = pageMod.PageMod({
  include: data.url("show_topic_history.html"),
  contentScriptFile: [data.url("jquery-3.0.0.min.js"),data.url("show_topic_history.js")],
  onAttach: function onAttach(worker) {
    showTopicHistory(worker);
  }
});

var showSetTopicHotKey = Hotkey({
  combo: "accel-shift-o",
  onPress: function() {
    tabs.open(data.url("set_topic.html"));
  }
});

var showLinkOverHotKey = Hotkey({
  combo: "accel-shift-l",
  onPress: function() {
    tabs.open(data.url("link_overview.html"));
  }
});

var showGraphHotKey = Hotkey({
  combo: "accel-shift-g",
  onPress: function() {
    tabs.open(data.url("link_graph.html"));
  }
});

var createBridgeHotKey = Hotkey({
  combo: "accel-shift-b",
  onPress: function() {
    //Immediately get the current page, where keypress was activated
    active_tab = tabs.activeTab.url;
    tabs.open(data.url("semantic_link.html"));
  }
});

var showTopicHistoryHotKey = Hotkey({
  combo: "accel-shift-h",
  onPress: function() {
    tabs.open(data.url("show_topic_history.html"));
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
  var sigint_dir = OS.Constants.Path.profileDir + "/sigint/";
  var full_path = OS.Path.join(sigint_dir + filename);
  return full_path;
}

function getCurrentTopic() {
  var current_topic_path = pathFinder('current_topic_json');
  var read_output_promise = readFile(current_topic_path);
  var current_topic = read_output_promise.then(
    function onFulfill(current_topic){
       return current_topic;
    });
  return current_topic;
}

function generateID() {
  var rand_num = Math.random();
  var id = base64.encode(rand_num.toString());
  return id;
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
        link["id"] = generateID();
        link["curr_topic"] = current_topic;
        var json_out = link;
        var link_motherlode_file_path = pathFinder('link_motherlode_json');
        linkWriter(json_out, link_motherlode_file_path);
      });
}

//Write current topic
function topicWrite(topic_arr) {
  var current_topic_path = pathFinder('current_topic_json');
  writeFile(topic_arr[0], current_topic_path);
}

//Check to see if a topic is currently set
function checkSetTopic() {
  //Wait for the panel to open
  //TODO: error check if file actually exists
  var check_current_topic_path = pathFinder('current_topic_json');
  var current_topic_promise = readFile(check_current_topic_path);
  current_topic_promise.then(
      function onFulfill(read_topic) {
        set_topic_worker.port.emit("curr_topic_contents", read_topic);
  });
}

//create topic history
function topicHistWrite(topic_to_archive) {
  //First, check if a topic history file already exists
  var path = pathFinder('topic_hist_json');
  let hist_exist_promise= OS.File.exists(path);
  hist_exist_promise.then(
    function onFulfill(exist) {
      var id = generateID();
      if (exist) {
        //if it exists, get existing file, parse as json
        var hist_read_promise = readFile(path);
        hist_read_promise.then(
          function onFulfill(existing_hist){
            var hist_obj = JSON.parse(existing_hist);
            //hist_obj is the name of the parsed data object,
            //topic_history is the name of the json array created in the skeleton
            var new_topic_obj = {};
            new_topic_obj[id] = topic_to_archive;
            hist_obj.topic_history.push(new_topic_obj);
            var new_hist_commit = JSON.stringify(hist_obj);
            writeFile(new_hist_commit, path);
        });
      } else {
        console.log("No topic history file found, dishing one up now...");
        var skeleton = '{"topic_history": [{"'+ id + '":["' + topic_to_archive[0] + '","' + topic_to_archive[1] + '"]}]}';
        writeFile(skeleton, path);
      }
    },
    function onReject(hist_write_reject) {
      console.warn('Could not find file: ' + hist_write_reject);
    });
}

function showTopicHistory(worker) {
  topic_hist_path = pathFinder('topic_hist_json');
  let hist_exist_promise = OS.File.exists(topic_hist_path);
  hist_exist_promise = hist_exist_promise.then(
    function onFulfill(histExist) {
      if (histExist) {
        var hist_output_promise = readFile(topic_hist_path);
        hist_output_promise.then(
          function onFulfill(hist_pile){
            var all_hist_obj = JSON.parse(hist_pile);
            worker.port.emit("send_hist_pile", all_hist_obj);
          });
      } else {
        //TODO: Create a user-visible dialog that tells the user
        //to create a topic and get going.
        console.log("topic history not found.");
      }
    },
    function onReject(reject_topic_info) {
      console.warn('Could not get topic history: ' + reject_topic_info);
    });
}

//Sort links for display in the link overview page
function sortCurrentLinks(links_obj) {
  //first sort by topic, then by current site
  var sorted = {};
  var all_links_array = links_obj["links"];
  for(var i=0; i< all_links_array.length; i++) {
    var header = all_links_array[i]["curr_topic"];
    var page = all_links_array[i]["curr_page"];
    if(!(header in sorted)) {
      sorted[header] = {};
      if(!(page in sorted[header])) {
        sorted[header][page] = [all_links_array[i]];
      } else {
        sorted[header][page].push(all_links_array[i])
      }
    } else {
      if(!(page in sorted[header])) {
        sorted[header][page] = [all_links_array[i]];
      } else {
        sorted[header][page].push(all_links_array[i])
      }
    }
  }
  return sorted;
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
            var sorted_links = sortCurrentLinks(all_links_obj);
            link_list_worker.port.emit("send_link_pile", sorted_links);
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

function graphRoutes() {
  motherlode_path = pathFinder('link_motherlode_json');
  let link_exist_promise = OS.File.exists(motherlode_path);
  link_exist_promise = link_exist_promise.then(
    function onFulfill(moLoExist) {
      if (moLoExist) {
        var link_output_promise = readFile(motherlode_path);
        link_output_promise.then(
          function onFulfill(link_pile){
            var all_links_obj = JSON.parse(link_pile);
            var sorted_links = sortCurrentLinks(all_links_obj);
            var current_topic_promise = getCurrentTopic();
            current_topic_promise.then(
              function onFulfill(current_topic) {
                var send_array = [sorted_links, current_topic]
                topic_graph_worker.port.emit("send_graph_data", send_array);
              });
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

function createSemanticBridge() {
  var current_tabs = getCurrentTabs();
  current_tabs.push(active_tab);
  semantic_link_worker.port.emit("current_tab_pile", current_tabs);
}

function getCurrentTabs() {
  var tab_arr = []
  for (let tab of tabs) {
    var tab_obj = {};
    tab_obj[tab.id] = tab.url;
    tab_arr.push(tab_obj);
  }
  return tab_arr;
}

function showLink() {
}

// a dummy function, to show how tests work.
// to see how to test this function, look at test/test-index.js
function dummy(text, callback) {
  callback(text);
}

exports.dummy = dummy;
