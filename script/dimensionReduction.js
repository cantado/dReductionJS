
var window = {};
var numeric;

function init(data){

	var p1 = new Promise(prom("numeric-1.2.6.min.js"));
	var p2 = new Promise(prom("bakk.js"));

	Promise.all([p1, p2]).then(function(){
		numeric = window.numeric;
		var dataset = JSON.parse(data.dataset);
		var bakk = new window.BAKK();
		var result = bakk[data.algo](dataset);

		postMessage(JSON.stringify(result));
	});
}

function prom(url){
	return function(resolve, reject){
		var xhr = new XMLHttpRequest;
		getDataString(url, xhr);
		xhr.onload = function() {
		  eval(xhr.response.replace("use strict", ""));
		  window.numeric = window.numeric || numeric;
		  resolve();
		};
	}
}

function getDataString(dataURL, xhr){
	xhr.onload = function() {
	  eval(xhr.response);
	};
	xhr.open('GET', dataURL);
	xhr.send();
}

self.onmessage = function(event) {
	init(event.data);
};
