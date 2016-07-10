//http://stackoverflow.com/questions/3872498/jquery-how-to-catch-keydown-mouse-click-event/3872560#3872560
$(function() {
  $("a").click(function(event) {
    if (event.altKey && event.ctrlKey) {
       console.log('Link Text: ' + $(this).text());
       console.log('Link Hypertext: ' + $(this).attr("href"));
       console.log('Link Surrounding Text: ' + $(this).parent().text());
       console.log('Current page where link lives: ' + window.location.href);
       console.log('Referring Document: ' + document.referrer);
    }
  });
});

