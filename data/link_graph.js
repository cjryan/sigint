self.port.on("send_graph_data", function graphData(sorted_links) {
//The following is based off of d3.js example http://bl.ocks.org/mbostock/1153292

//TODO: this will graph the current topic. Add ability to graph any historical topic.
  var current_topic = sorted_links[1];
  var link_obj = sorted_links[0][current_topic];
  var links = [];

  for (var key in link_obj) {
    if (link_obj.hasOwnProperty(key)) {
      var obj = link_obj[key];
        for (var prop in obj) {
          if (obj.hasOwnProperty(prop)) {
            for (var key2 in obj) {
              if (obj.hasOwnProperty(key2)) {
                var obj2 = obj[key2];
                var ref_page = ""
                var curr_page = ""
                var href_text = ""
                var link_text = ""
                for (var prop2 in obj2) {
                  if (obj2.hasOwnProperty(prop2)) {
                    //console.log(prop2 + " = " + obj2[prop2]);
                    if (prop2 == "ref_page") {
                      ref_page = obj2[prop2].slice(0,15) + "..." + obj2[prop2].slice(-15,-1) ;
                    } else if (prop2 == "curr_page") {
                      curr_page = obj2[prop2].slice(0,15) + "..." + obj2[prop2].slice(-15,-1) ;
                    } else if (prop2 == "href_text") {
                      href_text = obj2[prop2].slice(0,15) + "..." + obj2[prop2].slice(-15,-1) ;
                    } else if (prop2 == "link_text") {
                      link_text = obj2[prop2].slice(0,15) + "..." + obj2[prop2].slice(-15,-1) ;
                    }
                  }
                }
                //Each link contains 2 nodes worth of information:
                //Build out 2 nodes here, one ref_page -> curr_page,
                //the other curr_page -> href_text
                //if href_text is from a user selection, change the href_text
                //to be user-readable
                if (href_text == "User Highlighted Selection") {
                  href_text = link_text;
                }
                if (href_text == "Semantic Link") {
                  links.push({source: ref_page, target: curr_page, type: "semantic_link"});
                } else if (ref_page == ""){
                  links.push({source: curr_page, target: href_text, type: "normal_link"});
                } else {
                  links.push({source: ref_page, target: curr_page, type: "normal_link"});
                  links.push({source: curr_page, target: href_text, type: "normal_link"});
                }
              }
            }
          }
        }
      }
  }

//Next: http://stackoverflow.com/a/921808
  var nodes = {};

  // Compute the distinct nodes from the links.
  links.forEach(function(link) {
    link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
    link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
  });

  var width = 960,
      height = 500;

  var force = d3.layout.force()
      .nodes(d3.values(nodes))
      .links(links)
      .size([width, height])
      .linkDistance(60)
      .charge(-300)
      .on("tick", tick)
      .start();

  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);

  // Per-type markers, as they don't inherit styles.
  svg.append("defs").selectAll("marker")
      .data(["grey_link", "normal_link", "semantic_link"])
    .enter().append("marker")
      .attr("id", function(d) { return d; })
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", -1.5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
    .append("path")
      .attr("d", "M0,-5L10,0L0,5");

  var path = svg.append("g").selectAll("path")
      .data(force.links())
    .enter().append("path")
      .attr("class", function(d) { return "link " + d.type; })
      .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

  var circle = svg.append("g").selectAll("circle")
      .data(force.nodes())
    .enter().append("circle")
      .attr("r", 6)
      .call(force.drag);

  var text = svg.append("g").selectAll("text")
      .data(force.nodes())
    .enter().append("text")
      .attr("x", 8)
      .attr("y", ".31em")
      .text(function(d) { return d.name; });

  // Use elliptical arc path segments to doubly-encode directionality.
  function tick() {
    path.attr("d", linkArc);
    circle.attr("transform", transform);
    text.attr("transform", transform);
  }

  function linkArc(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
  }

  function transform(d) {
    return "translate(" + d.x + "," + d.y + ")";
  }
});
