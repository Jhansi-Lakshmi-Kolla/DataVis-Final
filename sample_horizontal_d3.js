var svg = d3.select("svg"),
	width = +svg.attr("width"),
	height = +svg.attr("height"),
	g = svg.append("g").attr("transform", "translate(100,0)");
	
var tree = d3.tree()
    .size([height - 400, width - 300]);
	
var treeObj;
var root;
var selected_year = 2016;
var selected_tourney = "wimbledon";

var startyr = 2000;
var endyr = 2016;
var options = "";
for(var year = startyr ; year <= endyr; year++){
  options += "<option>"+ year +"</option>";
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


function diagonal(d) {
  return "M" + d.y + "," + d.x
      + "C" + (d.parent.y + 100) + "," + d.x
      + " " + (d.parent.y + 100) + "," + d.parent.x
      + " " + d.parent.y + "," + d.parent.x;
}

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
	//console.log(treeObj);
	root = d3.stratify()
		.id(function(d) { return d.id; })
		.parentId(function(d) { return d.parent; })
		(treeObj);
		
	tree(root);
	
	g.selectAll("*").remove();
	
	var link = g.selectAll(".link")
				.data(root.descendants().slice(1))
				.enter().append("path")
				.attr("class", "link")
				.style("stroke", function(d) {return d.data.tag == 'W' ? "green":"red";})
				.attr("d", diagonal);
				
	var node = g.selectAll(".node")
				.data(root.descendants())
				.enter().append("g")
				.attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
				.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

	node.append("circle")
		.attr("r", 2.5);

	node.append("text")
		.attr("dy", 3)
		.attr("x", function(d) { return d.children ? -8 : 8; })
		.style("text-anchor", function(d) { return d.children ? "end" : "start"; })
		.style("fill", function(d) {return d.data.tag == 'W' ? "green":"red";})
		.text(function(d) { return d.data.tag == 'W' ? d.data.data.winner_name:d.data.data.loser_name; });
}
