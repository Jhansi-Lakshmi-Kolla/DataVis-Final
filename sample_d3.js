var svg = d3.select("svg"),
	width = +svg.attr("width"),
	height = +svg.attr("height"),
	g = svg.append("g").attr("transform", "translate(40,0)");
	
var tree = d3.tree()
    .size([height - 400, width - 160]);
	
var wimbledon_treeObj;
var root;
d3.csv("atp_matches_2016.csv", function(error, data) {
	if(error) throw error;
	var wimbledon_data = data.filter(function(row) {
		return row['tourney_name'] == 'Wimbledon';
	});
	
	var Aus_data = data.filter(function(row) {
		return row['tourney_name'] == 'Australian Open';
	});
	
	var french_data = data.filter(function(row) {
		return row['tourney_name'] == 'French Open';
	});
	
	var US_data = data.filter(function(row) {
		return row['tourney_name'] == 'US Open';
	});
	
	wimbledon_treeObj = [];
	wimbledon_data.forEach(function(d) {
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
		wimbledon_treeObj.push(winner_obj);
		wimbledon_treeObj.push(loser_obj);
		if(round == 'F') {
			var root_obj = {
				"id": d['winner_id'],
				"parent": "",
				"data": d,
				"tag": 'W'
			}
			wimbledon_treeObj.push(root_obj);
		}
	});
	console.log(wimbledon_treeObj);
	root = d3.stratify()
		.id(function(d) { return d.id; })
		.parentId(function(d) { return d.parent; })
		(wimbledon_treeObj);
		
	tree(root);
	
	var link = g.selectAll(".link")
				.data(root.descendants().slice(1))
				.enter().append("path")
				.attr("class", "link")
				.attr("d", diagonal);
				
	var node = g.selectAll(".node")
				.data(root.descendants())
				.enter().append("g")
				.attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

	node.append("circle")
		.attr("r", 2.5);

	node.append("text")
		.attr("y", function(d) { return d.children ? 8 : -8; })
		.attr("dx", 3)
		.style("text-anchor", function(d) { return d.children ? "top" : "bottom"; })
		.text(function(d) { console.log(d.data.data.winner_name); return d.data.tag == 'W' ? d.data.data.winner_name:d.data.data.loser_name; });

});

/*function diagonal(d) {
  return "M" + d.x + "," + d.y
      + "L" + (d.parent.x + 100) + "," + d.y
      + " " + (d.parent.x + 100) + "," + d.parent.y
      + " " + d.parent.x + "," + d.parent.y;
}*/

/*function diagonal(d) {
  return "M" + d.x + "," + d.y
      + "L" + d.parent.x + "," + d.parent.y;
}*/

function diagonal(d) {
  return "M" + d.x + "," + d.y
      + "C" + (d.parent.x + 100) + "," + d.y
      + " " + (d.parent.x + 100) + "," + d.parent.y
      + " " + d.parent.x + "," + d.parent.y;
}
