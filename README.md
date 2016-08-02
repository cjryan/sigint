#sigint
A research assistant to help with online searches. This plugin was created to assist in Soviet history research and early US overflights of the Soviet Union, (ostensibly to gather information, particularly signals/electronic information), therefore the name SIGINT (Signals Intelligence) was chosen.

Far from being bound to just history reasearch, you can use sigint for all of your online thought-keeping needs.

##Follow the trail
In doing research, it is oftentimes problematic to trace the source of a document, a note, an anecdote, or a bit of information after some time has passed. With sigint, you can create a project, and keep track of your research thread, from inception to closure. You can also create tags to keep track of your current progress.

##Context
Many times, links are woven in as part of a surrounding text, [like so](https://github.com/cjryan/sigint). Long after that link has been bookmarked or written down, it is easy to forget why you saved that link or what you downloaded from it. sigint will allow you to save the surrounding text of a link, as part of your thread.

Similarly, tabs can be used as to-do lists, resulting in dozens or hundreds of open tabs. Sigint will help save your tabs, links, and research to reduce your browser load.

##Getting Started
First, install the add-on. This can be done by cloning this repository and building it out, using the Firefox [jpm utility](https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Getting_Started_(jpm)). Please follow the 'Prerequisites' section of the link, and install the nodejs jpm utility. Once it's installed, either git clone this repository or download one of the point releases on the 'Releases' page.

Once you've installed jpm, and cloned/downloaded the repository, run the jpm utility in the cloned/extracted directory, and run ```jpm xpi```. This will create a .xpi file for you to point the Firefox Add-on page to.

Once the add-on is installed, you can begin to track a topic of your research. Press ctrl-shift-o (or command-shift-o on a Mac), and enter in a topic. From here, all of your links will be saved under this topic, until you change the topic. Pressing ```ctrl-shift-o``` will let you see your current topic; pressing ```ctrl-shift-o``` again will bring up a dialog to change it to a different one, depending on your research at the moment.

Note! Do not be afraid to change your topic often; in fact, it is highly encouraged. Think of your topic as a Ctrl-S (Save) on a (Libre)Office document. Don't be afraid of being stuck on one monolithic topic - you can always return to your current one, but don't worry about branching out.

To save a link, press ```ctrl-alt```, and ```mouse left-click``` on the link at the same time. This will preserve the link, and its metadata (date/time, referring page, current page, link href attribute, and surrounding text).

In addition to saving links, you can also save highlighted text. First, left-click with your mouse and drag over some text in a page. With your ```left-mouse button``` still pressed, hold the ```'s' key```.

Once you've successfully "meta-clicked" a link, or highlighted/clicked/'s' some text, the red badge on the add-on button will increment by one. If the badge does not increment by one, it means the add-on did not successfully register the click event; please try again in this case.

To view your saved links and highlights, press ```ctrl-shift-l```, which will bring up a list of links and highlights that you have saved to date under a given topic. From here, click on any one of the links to view its metadata, as well as edit it. You can also add notes in this new edit page to add context or thoughts to any particular link.
