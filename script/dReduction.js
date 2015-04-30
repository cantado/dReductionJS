(function(window, undefined){
	
	function dReduction(opt){
		if(!numeric){
			throw("You have to include numeric.js");
		}

		opt = opt || {};

		this.dim 				= opt.dim;
		this.neighbors 	= opt.neighbors;
	}

	var merge = function merge(obj1, obj2){
		var obj = {};
		for(var key in obj1){ obj[key] = obj1[key]; }
		for(var key in obj2){ obj[key] = obj2[key]; }
		return obj;
	};

	var sum = function sum(from, to, func){
		var s = 0;
		for(var i=from; i<to; i++){
			s += func(i);
		}
		return s;
	};

	var mid = function mid(arr){
		var s = sum(0, arr.length, function(i){ return arr[i]; });
		return s/arr.length;
	};

	var cov = function cov(x,y){
		var xd = mid(x),
				yd = mid(y),
				ssx, ssy;

		var s = sum(0, x.length, function(i){
			return (x[i]-xd)*(y[i]-yd);
		});
		return s/(x.length-1);
	};

	var diff = function(X, Y){
		var n = X.length,
				s;
		
		s = sum(0, n, function(i){
			return Math.pow((X[i]-Y[i]), 2);
		});

		return Math.sqrt(s);
	};

	var multiM = function(){
		var arr = arguments,
				p = arr[0],
				i;

		for(i=1; i<arr.length; i++){
			p = numeric.dot(p, arr[i]);
		}

		return p;
	};

	/**********
	 *
	 * PCA
	 *
	 **********/
	dReduction.prototype.pca = function pca(X, dim){
		var m 				= X.length,
				n 				= X[0].length,
				newDim 		= dim || this.dim || 3,
				Xc = Xct	= [],
				CM = Y 		= [],
				ev = evt 	= [],
				svd, i, j, ew;

		if(n < newDim){
			throw "the dimension of the data has to be grater than the new dimension ("+newDim+")";
		}

		Xc = this.centerMatrix(X);
		CM = this.covarianceMatrix(X);

		svd = numeric.svd(CM);
		evt = numeric.transpose(svd.V).slice(0,newDim);
		ev = numeric.transpose(evt);
		ew = svd.S;

		Xct = numeric.transpose(Xc);

		Y = numeric.dot(Xc, ev);
		Yt = numeric.transpose(Y);

		return [X, ew, evt, Y];
	}

	/**********
	 *
	 * LPP
	 *
	 **********/
	dReduction.prototype.lpp = function lpp(X, opt){
		opt = opt || {};
		var m 						= X.length,
				n 						= X[0].length,
				newDim 				= opt.dim || this.dim || 3,
				numNeighbors 	= opt.neighbors || this.neighbors || 2,
				Xt 						= numeric.transpose(X),
				W = D = L = G = [],
				Ginv = C = ev = [],
				evt = Y = Yt	= [],
				i, j, svd, ew;

		W = this.getAdjacencyMatrix(X, numNeighbors);
		D = this.getDegreeMatrix(W);
		L = numeric.sub(D, W);

		A = multiM(Xt,L,X);
		B = multiM(Xt,D,X);

		G = this.getCholesky(B);
		Ginv = numeric.inv(G);

		C = multiM(Ginv, A, numeric.transpose(Ginv));

		svd = numeric.svd(C);
		ew = svd.S;
		evt = numeric.transpose(svd.V).slice(0,newDim);
		ev = numeric.transpose(evt);
		ev = numeric.dot(numeric.transpose(G), ev);

		Y = numeric.dot(X, ev);

		return [X, ew, evt, Y];
	}





	dReduction.prototype.centerMatrix = function centerMatrix(X){
		var m = X.length,
				n = X[0].length,
				mittel = [],
				Xt = [],
				Xc = [],
				i, j;

		Xt = numeric.transpose(X);
		for(i=0; i<n; i++){
			mittel.push(numeric.sum(Xt[i]) / m);
		}

		for(i=0; i<n; i++){
			Xc[i] = [];
			for(j=0; j<m; j++){
				Xc[i][j] = X[j][i] - mittel[i];
			}
		}
		return numeric.transpose(Xc);
	}

	dReduction.prototype.covarianceMatrix = function covarianceMatrix(X){
		var CM = [],
				n = X[0].length;
		X = numeric.transpose(X);
		for(i=0; i<n; i++){
			CM[i] = [];
			for(j=0; j<=i; j++){
				CM[i][j] = cov(X[i], X[j]);
				CM[j][i] = CM[i][j];
			}
		}
		return CM;
	}

	dReduction.prototype.getCholesky = function getCholesky(X){
		var n = X.length,
				L = [],
				i, j, g, s;

		for(i=0; i<n; i++){
			L[i] = Array.apply(null, new Array(n)).map(Number.prototype.valueOf, 0);
			for(j=0; j<=i; j++){
				g = X[i][j];

				s = sum(0, j, function(k){ return L[i][k]*L[j][k]; });
				g = g - s;

				if(i > j){
					L[i][j] = g / L[j][j];
				}
				else if(g > 0){
					L[i][i] = Math.sqrt(g);
				}
				else{
					throw "Error: Matrix is not symmetric positiv. ["+i+"]["+j+"]("+X[i][j]+") != ["+j+"]["+i+"]("+X[j][i]+")";
				}
			}
		}

		return L;
	}

	dReduction.prototype.getDegreeMatrix = function getDegreeMatrix(X){
		var m = X.length,
				Xt = [],
				D = [],
				i, j, min, idx;

		Xt = numeric.transpose(X);
		for(i=0; i<m; i++){
			D[i] = Array.apply(null, new Array(m)).map(Number.prototype.valueOf, 0);
			D[i][i] = numeric.sum(Xt[i]);
		}

		return D;
	}

	dReduction.prototype.getAdjacencyMatrix = function getAdjacencyMatrix(X, numNeighbors){
		var m = X.length,
				diffM = [],
				neighborsM = [],
				i, j;

		diffM = this.getDiffMatrix(X);
		neighborsM = this.getNearestNeighbors(diffM, numNeighbors, function(){ return 1; });

		return neighborsM;
	}

	dReduction.prototype.getDiffMatrix = function getDiffMatrix(X){
		var m = X.length,
				diffM = [],
				i, j;

		for(i=0; i<m; i++){
			diffM[i] = [];
			for(j=0; j<=i; j++){
				diffM[i][j] = diff(X[i], X[j]);
				diffM[j][i] = diffM[i][j];
			}
		}

		return diffM;
	}

	dReduction.prototype.getNearestNeighbors = function getNearestNeighbors(diffM, numNeighbors, func){
		var m = diffM.length,
				neighborsM = [],
				func = func || function(){ return true; },
				i, j, min, idx;

		for(j=0; j<numNeighbors; j++){
			for(i=0; i<m; i++){
				diffM[i][i] = Infinity;
				neighborsM[i] = neighborsM[i] || Array.apply(null, new Array(m)).map(Number.prototype.valueOf, 0);
				min = Math.min.apply(null, diffM[i]);
				idx = diffM[i].indexOf(min);
				neighborsM[i][idx] = func(i, idx);
				diffM[i][idx] = Infinity;
			}
		}

		return neighborsM;
	}

	window.dReduction = dReduction;

})(window);