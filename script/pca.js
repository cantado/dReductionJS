
(function(window, undefined){

	function PCA(data, dimension){
		dimension = dimension || 3;
		return this.calc(data, dimension);
	}

	PCA.prototype.calc = function init(data, dimension){
		this.mean = this.getMean(data)
		this.cor = this.getCovarianceMatrix(this.mean);
		this.eigenVectors = numeric.svd(this.cor).U;
		this.featureVectors = this.getSubMatrix(this.eigenVectors, dimension);
		this.pca = numeric.dot(this.mean, this.featureVectors);
		console.log(this.cor);
		return this.pca;
	}

	PCA.prototype.getCovarianceMatrix = function(m){
		var c = [];
		m = this.transMatrix(m);
		for(var i=0; i<m.length; i++){
			var row = [];
			for(var j=0; j<m.length; j++){
				row.push(this.cov(m[i], m[j]));
			}
			c.push(row);
		}
		return this.transMatrix(c);
	}

	PCA.prototype.getMean = function(m){
		m = this.transMatrix(m);
		for(var i=0; i<m.length; i++){
			var avg = this.rowSum(m[i]) / m[i].length;
			for(var j=0; j<m[i].length; j++){
				m[i][j] = m[i][j] - avg;
			}
		}
		return this.transMatrix(m);
	}

	PCA.prototype.rowSum = function(row){
		var sum = 0;
		for(var j=0; j<row.length; j++){
			sum+=row[j];
		}
		return sum;
	}

	PCA.prototype.cov = function(x,y){
		var xd = this.getMid(x),
				yd = this.getMid(y),
				sum = 0;
		for(var i=0; i<x.length; i++){
			sum += ((x[i]-xd)*(y[i]-yd)/(x.length-1));
		}
		return sum;
	}

	PCA.prototype.getMid = function(x){
		var sum = 0;
		for(var i=0; i<x.length; i++){
			sum += x[i];
		}
		return sum/x.length;
	}

	PCA.prototype.transMatrix = function(m){
		var m1 = [];
		for(var j=0; j<m[0].length; j++){
			var row = [];
			for(var i=0; i<m.length; i++){
				row.push(m[i][j]);
			}
			m1.push(row);
		}
		return m1;
	}

	PCA.prototype.getSubMatrix = function(m,n){
		var m1 = [];
		for(var i=0; i<m.length; i++){
			m1.push(m[i].slice(0,n));
		}
		return m1;
	}

	window.PCA = PCA;

})(window);
