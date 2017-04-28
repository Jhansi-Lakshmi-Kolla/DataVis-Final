var margin = {top: 20, right: 100, bottom: 20, left: 100},
    width = (1000) - margin.right - margin.left,
    height = (800)- margin.top - margin.bottom;


var svg = d3.select("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
	.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var tree = d3.layout.tree()
    .size([width - 20, height - 20]);

var root;
var treeObj; 
var selected_year = 2016;
var selected_tourney = "wimbledon"; 
var selected_tree_type = "full";
var duration = 750;  


var diagonal = d3.svg.diagonal().projection(function(d) { return [d.y, d.x]; });
var node = svg.selectAll(".node"),
    link = svg.selectAll(".link");
    
var startyr = 2000;
var endyr = 2016;
var options = "";
for(var year = startyr ; year <= endyr; year++){
	if(year == selected_year) {
		options += "<option selected=selected>"+ year +"</option>";
	} else {
		options += "<option>"+ year +"</option>";
	}
  
}
document.getElementById("yearList").innerHTML = options;

var year_wise_data = [];

for(var year = startyr ; year <= endyr; year++){
	d3.csv("atp_matches_" + year + ".csv", function(error, data) {
		if(error) throw error;
		var tournaments = {};
		
		tournaments.wimbledon= data.filter(function(row) {
			return row['tourney_name'] == 'Wimbledon';
		});

		tournaments.aus = data.filter(function(row) {
			return row['tourney_name'] == 'Australian Open';
		});

		tournaments.french = data.filter(function(row) {
			return row['tourney_name'] == 'French Open';
		});

		tournaments.us = data.filter(function(row) {
			return row['tourney_name'] == 'US Open' || row['tourney_name'] == 'Us Open';
		});
		
		if((data[0]["tourney_id"]).startsWith(selected_year)) {
			console.log("year = " + selected_year);
			loadTree(tournaments[selected_tourney]);
		} else {
			console.log("year != " + selected_year);
		}
		year_wise_data.push(tournaments);
	});
}

//d3.select(self.frameElement).style("height", "800px");

function onYearChange() {
	selected_year = +document.getElementById("yearList").value;
	console.log("loading tree of " + selected_year + " " + selected_tourney);
	loadTree(year_wise_data[selected_year-startyr][selected_tourney]);
}

function onTourneyChange() {
	selected_tourney = document.getElementById("tournamentList").value;
	console.log("loading tree of " + selected_year + " " + selected_tourney);
	loadTree(year_wise_data[selected_year-startyr][selected_tourney]);
}


function onTreeTypeChange(treeRadio) {
	if(selected_tree_type != treeRadio.value) {
		selected_tree_type = treeRadio.value;
		loadTree(year_wise_data[selected_year-startyr][selected_tourney]);
	}
}

function loadTree(csv_data) {
	treeObj = [];
	csv_data.forEach(function(d) {
		var round = d['round'];
		var id_winner = round + '-' + d['winner_id'];
		var id_loser = round + '-' + d['loser_id'];
		var next_round;
		if(round == 'F') {
			next_round = '';
		} else if (round == 'SF') {
			next_round = 'F';
		} else if (round == 'QF') {
			next_round = 'SF';
		} else if (round == 'R16') {
			next_round = 'QF';
		} else if (round == 'R32') {
			next_round = 'R16';
		} else if (round == 'R64') {
			next_round = 'R32';
		} else if (round == 'R128') {
			next_round = 'R64';
		} else {
			console.log("unknown round " + round);
			return;
		}
		var id_parent;
		if(round != 'F') {
			id_parent = next_round + '-' + d['winner_id'];
		} else {
			id_parent = d['winner_id'];
		}
		var winner_obj = {
			"id": id_winner,
			"parent": id_parent,
			"data": d,
			"tag": 'W'
		}
		
		var loser_obj = {
			"id": id_loser,
			"parent": id_parent,
			"data": d,
			"tag": 'L'
		}
		treeObj.push(winner_obj);
		treeObj.push(loser_obj);
		if(round == 'F') {
			var root_obj = {
				"id": d['winner_id'],
				"parent": "",
				"data": d,
				"tag": 'W'
			}
			treeObj.push(root_obj);
		}
	});
	var dataMap = treeObj.reduce(function(map, node) {
		map[node.id] = node;
		return map;
	}, {});
	
	var treeData = [];
	treeObj.forEach(function(node) {
		var parent = dataMap[node.parent];
		if (parent) {
			(parent.children || (parent.children = []))
				.push(node);
		} else {
			treeData.push(node);
		}
	});
		
	tree(treeData);
	loadCollapsibleTree(treeData);
}

function loadCollapsibleTree(root_data) {
	root = root_data[0];
	root.x0 = height / 2;
	root.y0 = 0;

	function collapse(d) {
		if (d.children) {
		  d._children = d.children;
		  d._children.forEach(collapse);
		  d.children = null;
		}
	}
	if(selected_tree_type != "full") {
		root.children.forEach(collapse);
	}
	update(root);
}



function update(source) {
  var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);
  // Normalize for fixed-depth.
  //nodes.forEach(function(d) { d.y = d.depth * 180; });
  var node = svg.selectAll("g.node")
      .data(nodes, function(d) { return d.id; });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .on("click", click);

  nodeEnter.append("circle")
      .attr("r", 1e-6)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeEnter.append("text")
      .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(function(d) { return d.tag == 'W' ? d.data.winner_name:d.data.loser_name; })
	  .style("fill", function(d) { return d.tag == 'W' ? "green":"red"; } )
      .style("fill-opacity", 1e-6);

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeUpdate.select("circle")
      .attr("r", 4.5)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeUpdate.select("text")
      .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .remove();

  nodeExit.select("circle")
      .attr("r", 1e-6);

  nodeExit.select("text")
      .style("fill-opacity", 1e-6);

  // Update the links…
  var link = svg.selectAll("path.link")
      .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      });

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

function click(d) {
	if(selected_tree_type != "full") {
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}
		update(d);
	}
  
}

