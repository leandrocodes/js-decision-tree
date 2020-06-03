//This file contains example training data and samples

//some sample data we'll be using
//http://www.cise.ufl.edu/~ddd/cap6635/Fall-97/Short-papers/2.htm
var examples = [
	{
		movie: 'movie1',
		originCountry: 'EUA',
		bigStar: true,
		movieGenre: 'cientific',
		success: true
	},
	{ movie: 'movie2', originCountry: 'EUA', bigStar: false, movieGenre: 'comedy', success: false },
	{ movie: 'movie3', originCountry: 'EUA', bigStar: true, movieGenre: 'comedy', success: true },
	{ movie: 'movie4', originCountry: 'EUR', bigStar: false, movieGenre: 'comedy', success: true },
	{
		movie: 'movie5',
		originCountry: 'EUR',
		bigStar: true,
		movieGenre: 'cientific',
		success: false
	},
	{ movie: 'movie6', originCountry: 'EUR', bigStar: true, movieGenre: 'romance', success: false },
	{ movie: 'movie7', originCountry: 'BR', bigStar: true, movieGenre: 'comedy', success: false },
	{
		movie: 'movie8',
		originCountry: 'BR',
		bigStar: false,
		movieGenre: 'cientific',
		success: false
	},
	{ movie: 'movie9', originCountry: 'EUR', bigStar: true, movieGenre: 'comedy', success: true },
	{ movie: 'movie10', originCountry: 'EUA', bigStar: true, movieGenre: 'comedy', success: true }
]

examples = _(examples)
var features = ['originCountry', 'bigStar', 'movieGenre']
var samples = [
	{ originCountry: 'EUA', bigStar: false, movieGenre: 'comedy', success: false },
	{ originCountry: 'EUR', bigStar: true, movieGenre: 'romance', success: false },
	{ originCountry: 'EUR', bigStar: true, movieGenre: 'comedy', success: true }
]

/**
 *
 *
 * @param {*} dataSet
 * @param {*} target
 * @param {*} features
 * @returns
 */
const id3 = (dataSet, target, features) => {
	console.log('target: ', target)
	// EXTRAI A LISTA DE VALORES IGUAIS A TARGET E DEPOIS REMOVE OS REPETIDOS
	const targets = _.unique(dataSet.pluck(target))
	console.log('targets: ', targets)
	if (targets.length == 1) {
		return {
			type: 'result',
			val: targets[0],
			name: targets[0],
			alias: targets[0] + randomTag()
		}
	}
	if (features.length == 0) {
		var topTarget = mostCommon(dataSet.pluck(target))
		return { type: 'result', val: topTarget, name: topTarget, alias: topTarget + randomTag() }
	}
	var bestFeature = maxGain(dataSet, target, features)
	var remainingFeatures = _.without(features, bestFeature)
	var possibleValues = _.unique(dataSet.pluck(bestFeature))
	var node = { name: bestFeature, alias: bestFeature + randomTag() }
	node.type = 'feature'
	node.vals = _.map(possibleValues, function (v) {
		var newDataSet = _(
			dataSet.filter(function (x) {
				return x[bestFeature] == v
			})
		)
		var child_node = { name: v, alias: v + randomTag(), type: 'feature_value' }
		child_node.child = id3(newDataSet, target, remainingFeatures)
		return child_node
	})
	return node
}

var predict = function (id3Model, sample) {
	var root = id3Model
	while (root.type != 'result') {
		var attr = root.name
		var sampleVal = sample[attr]
		var childNode = _.detect(root.vals, function (x) {
			return x.name == sampleVal
		})
		root = childNode.child
	}
	return root.val
}

//necessary math functions

var entropy = function (vals) {
	var uniqueVals = _.unique(vals)
	var probs = uniqueVals.map(function (x) {
		return prob(x, vals)
	})
	var logVals = probs.map(function (p) {
		return -p * log2(p)
	})
	return logVals.reduce(function (a, b) {
		return a + b
	}, 0)
}

var gain = function (_s, target, feature) {
	var attrVals = _.unique(_s.pluck(feature))
	var setEntropy = entropy(_s.pluck(target))
	var setSize = _s.size()
	var entropies = attrVals.map(function (n) {
		var subset = _s.filter(function (x) {
			return x[feature] === n
		})
		return (subset.length / setSize) * entropy(_.pluck(subset, target))
	})
	var sumOfEntropies = entropies.reduce(function (a, b) {
		return a + b
	}, 0)
	return setEntropy - sumOfEntropies
}

var maxGain = function (_s, target, features) {
	return _.max(features, function (e) {
		return gain(_s, target, e)
	})
}

var prob = function (val, vals) {
	var instances = _.filter(vals, function (x) {
		return x === val
	}).length
	var total = vals.length
	return instances / total
}

var log2 = function (n) {
	return Math.log(n) / Math.log(2)
}

var mostCommon = function (l) {
	return _.sortBy(l, function (a) {
		return count(a, l)
	}).reverse()[0]
}

var count = function (a, l) {
	return _.filter(l, function (b) {
		return b === a
	}).length
}

var randomTag = function () {
	return '_r' + Math.round(Math.random() * 1000000).toString()
}

//Display logic

const drawGraph = (id3Model, divId) => {
	var g = new Array()
	g = addEdges(id3Model, g).reverse()
	window.g = g
	var data = google.visualization.arrayToDataTable(g.concat(g))
	var chart = new google.visualization.OrgChart(document.getElementById(divId))
	google.visualization.events.addListener(chart, 'ready', function () {
		const nodes = document.querySelectorAll('.google-visualization-orgchart-node')
		console.log(nodes)
		nodes.forEach(node => {
			var oldVal = node.innerHTML
			if (oldVal) {
				var cleanVal = oldVal.replace(/_r[0-9]+/, '')
				node.innerHTML = cleanVal
				if (node.innerText.includes('true')) node.style.color = '#659B92'
				else if (node.innerText.includes('false')) node.style.color = '#FF8961'
			}
		})
	})
	chart.draw(data, { allowHtml: true })
}

var addEdges = function (node, g) {
	if (node.type == 'feature') {
		node.vals.forEach(nodeVal => {
			g.push([nodeVal.alias, node.alias, ''])
			g = addEdges(nodeVal, g)
		})
		return g
	}
	if (node.type == 'feature_value') {
		g.push([node.child.alias, node.alias, ''])
		if (node.child.type != 'result') {
			g = addEdges(node.child, g)
		}
		return g
	}
	return g
}

// var renderSamples = function (samples, $el, model, target, features) {
// 	_.each(samples, function (s) {
// 		var features_for_sample = _.map(features, function (x) {
// 			return s[x]
// 		})
// 		$el.append(
// 			'<tr><td>' +
// 				features_for_sample.join('</td><td>') +
// 				'</td><td><b>' +
// 				predict(model, s) +
// 				'</b></td><td>actual: ' +
// 				s[target] +
// 				'</td></tr>'
// 		)
// 	})
// }

var renderTrainingData = function (_training, $el, target, features) {
	_training.each(function (s) {
		$el.append(
			'<tr><td>' +
				_.map(features, function (x) {
					return s[x]
				}).join('</td><td>') +
				'</td><td>' +
				s[target] +
				'</td></tr>'
		)
	})
}

var calcError = function (samples, model, target) {
	var total = 0
	var correct = 0
	_.each(samples, function (s) {
		total++
		var pred = predict(model, s)
		var actual = s[target]
		if (pred == actual) {
			correct++
		}
	})
	return correct / total > 1 ? 'error' : 'success'
}

const trainModel = id3(examples, 'success', features)
drawGraph(trainModel, 'canvas')
// renderSamples(samples, $('#samples'), testModel, 'success', features)
// renderTrainingData(examples, $('#training'), 'success', features)
console.log(calcError(samples, trainModel, 'success'))
