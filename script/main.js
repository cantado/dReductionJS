
var dr = new dReduction();
var w;
var dataset = [];

window.algo = function(){};
window.callback = function(){};

$(function(){

	$(document).on('change', '.btn-file :file', function() {
	  var input = $(this),
	      label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
	  input.trigger('fileselect', [label]);
	});

	$('#algo').on('change', function(e){
		recalc(dataset);
	});

	$('.btn-file :file').on('fileselect', function(event, label) {   
    var input = $(this).parents('.input-group').find(':text'),
    		files = $(event.currentTarget).get(0).files;
    input.val(label);

    readFiles(files);
  });
});

function readFiles(files){
	var reader = new FileReader();

  function readFile(index){
		if( index >= files.length ) return;

    var file = files[index];
    reader.onload = function(e) {  
      var result 	= e.target.result.replace(/,/g, '.'),
  				rows 		= result.split('\n');

	  	dataset = [];

	  	for(var i=0; i<rows.length; i++){
	  		rows[i] = rows[i].split(';');
				var colCount = rows[i].length;

	  		if(colCount === 1){
	  			continue;
	  		}

	  		var row = [];
	  		for(var j=0; j<colCount; j++){
	  			row.push(parseFloat(rows[i][j]));
	  		}
	  		dataset.push(row);
	  	}

	  	recalc(dataset, dataset.length);

	  	//dataset = numeric.transpose(dataset);
	  	/*while(dataset.length > 100){
	  		dataset = dataset.splice(0, dataset.length-100);
	  		recalc(dataset, dataset.length);
	  	}*/

      readFile(index+1)
    }

    reader.readAsText(file);
  }
  
  readFile(0);
}

/** GLOBAL FUNCTIONS **/


function recalc(dataset){

	var visualization = document.getElementById('visualization');
	var varianceDiagram = document.getElementById('varianceDiagram');
	var algo = $('#algo').val();

	visualization.innerHTML = "LOADING...";
	varianceDiagram.innerHTML = "LOADING...";

	if(typeof(Worker) !== undefined){
		w = new Worker("script/dimensionReduction.js");
		w.postMessage({
			dataset: JSON.stringify(dataset),
			algo: algo
		});
	}

	w.onmessage = function(result){
		result = JSON.parse(result.data);
		var data = result[3];
		var variances = getVariancesInPercent(result[1]);

		drawGraph(data, visualization);
		drawDiagram(variances, varianceDiagram);
	}

	/*var visualization = document.getElementById('visualization');
	var varianceDiagram = document.getElementById('varianceDiagram');
	var algo = $('#algo').val();

	visualization.innerHTML = "LOADING...";
	varianceDiagram.innerHTML = "LOADING...";

	var result = dr[algo](dataset);

	var data = result[3];
	var variances = getVariancesInPercent(result[1]);

	drawGraph(data, visualization);
	drawDiagram(variances, varianceDiagram);*/

	
}

function getVariancesInPercent(variances){
	var sum = 0,
			i;
	for(i=0; i<variances.length; i++){
		sum += variances[i];
	}
	for(i=0; i<variances.length; i++){
		variances[i] = (variances[i]/sum)*100;
	}
	return variances;
}

function drawGraph(res, container){
	container.innerHTML = '';
	if(res[0].length < 3){
		throw "Result has a dimension lower than 3";
	}
	// Create and populate a data table.
	var data = new vis.DataSet();
	// create some nice looking data with sin/cos
	var counter = 0;
	for (var x = 0; x < res.length; x++) {
	  data.add({
	  	id:counter++,
	  	x:res[x][0],
	  	y:res[x][1],
	  	z:res[x][2]});
	}

	// specify options
	var options = {
	    width:  '500px',
	    height: '450px',
	    showPerspective: true,
	    showGrid: false,
	    showShadow: false,
	    keepAspectRatio: true,
	    verticalRatio: 1,
	    xLabel: 'PCA1',
	    yLabel: 'PCA2',
	    zLabel: 'PCA3',
	    color: false
	};

	// Instantiate our graph object.
	var graph3d = new vis.Graph3d(container, data, options);
}

function drawDiagram(res, container){
	var generateLabels = function(arr){
		var labels = [];
		for(var i=0; i<arr.length; i++){
			labels.push('PCA'+(i+1));
		}
		return labels;
	}

	container.innerHTML = '';
	var ctx = document.createElement('canvas');
	ctx.style.height = '450px';
	ctx.style.width = '100%';
	container.appendChild(ctx);
	ctx = ctx.getContext('2d');

  var labels = generateLabels(res);
  var datasets = { data: res };
  var data = { labels: labels, datasets: [datasets] };
  var options = {};

  var myBarChart = new Chart(ctx).Bar(data, options);
}
