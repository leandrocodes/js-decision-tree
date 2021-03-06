import movies from '../data/movies.js'

let features = ['originCountry', 'bigStar', 'movieGenre']
let samples = [
	{
		originCountry: 'EUA',
		bigStar: false,
		movieGenre: 'comedy',
		success: false
	},
	{
		originCountry: 'EUR',
		bigStar: true,
		movieGenre: 'romance',
		success: false
	},
	{
		originCountry: 'EUR',
		bigStar: true,
		movieGenre: 'comedy',
		success: true
	}
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
	let sets = dataSet.map(set => {
		return set.success
	})
	let filterSets = sets.filter((set, index) => {
		return sets.indexOf(set) == index
	})

	if (filterSets.length == 1) {
		return {
			type: 'result',
			val: filterSets[0],
			name: filterSets[0],
			alias: filterSets[0] + randomTag()
		}
	}
	if (features.length == 0) {
		let topTarget = mostCommon(sets)
		return {
			type: 'result',
			val: topTarget,
			name: topTarget,
			alias: topTarget + randomTag()
		}
	}

	let bestFeature = maxGain(dataSet, target, features)
	// console.log(bestFeature)
	let remainingFeatures = features.filter(f => {
		if (f != bestFeature) return f
	})

	sets = dataSet.map(set => {
		return set[bestFeature]
	})

	filterSets = sets.filter((prop, index) => {
		return sets.indexOf(prop) == index
	})

	let node = { name: bestFeature, alias: bestFeature + randomTag() }
	node.type = 'feature'

	node.vals = filterSets.map(filterSet => {
		// TODO: REMOVER UNDERSCORE
		let newDataSet = dataSet.filter(set => {
			if (set[bestFeature] == filterSet) return set
		})

		let child_node = {
			name: filterSet,
			alias: filterSet + randomTag(),
			type: 'feature_value'
		}
		child_node.child = id3(newDataSet, target, remainingFeatures)
		return child_node
	})
	return node
}

const predict = (id3Model, sample) => {
	let leaf = id3Model
	while (leaf.type != 'result') {
		let attr = leaf.name
		let sampleVal = sample[attr]
		let childNode = leaf.vals.find(val => {
			return val.name == sampleVal
		})
		leaf = childNode.child
	}
	return leaf.val
}

//necessary math functions
const entropy = vals => {
	let uniqueVals = vals.filter((val, index) => {
		return vals.indexOf(val) === index
	})

	let probs = uniqueVals.map(uniqueVal => {
		return prob(uniqueVal, vals)
	})

	let logVals = probs.map(prob => {
		return -prob * log2(prob)
	})

	return logVals.reduce((a, b) => {
		return a + b
	}, 0)
}

const gain = (dataSet, target, feature) => {
	let features = dataSet.map(set => set[feature])

	let attrVals = features.filter((feature, index) => features.indexOf(feature) === index)

	let setEntropy = entropy(dataSet.map(set => set[target]))

	let setSize = Object.keys(dataSet).length

	let entropies = attrVals.map(etp => {
		let subset = dataSet.filter(set => {
			return set[feature] === etp
		})

		return (
			(subset.length / setSize) *
			entropy(
				subset.map(set => {
					return set[target]
				})
			)
		)
	})

	let sumOfEntropies = entropies.reduce((a, b) => {
		return a + b
	}, 0)

	return setEntropy - sumOfEntropies
}

const maxGain = (dataSet, target, features) => {
	let objFeatures = []

	// TODO: ELIMINAR REDUNDANCIA
	let maxGain = Math.max(...features.map(f => gain(dataSet, target, f)))

	features.forEach(feature => {
		objFeatures.push({
			name: feature,
			gain: gain(dataSet, target, feature)
		})
	})

	let maxObj = objFeatures.find(feature => feature.gain == maxGain)
	return maxObj.name
}

const prob = (val, vals) => {
	let instances = vals.filter(value => {
		return value === val
	}).length

	let total = vals.length

	return instances / total
}

const log2 = n => {
	return Math.log(n) / Math.log(2)
}

const mostCommon = sets => {
	return sets
		.sort(set => {
			return count(set, sets)
		})
		.reverse()[0]
}

const count = (set, sets) => {
	return sets.filter(thisSet => {
		return thisSet === set
	}).length
}

const randomTag = () => {
	return '_r' + Math.round(Math.random() * 1000000).toString()
}

//Display logic
const drawGraph = (id3Model, divId) => {
	let g = new Array()
	g = addEdges(id3Model, g).reverse()
	window.g = g
	let data = google.visualization.arrayToDataTable(g.concat(g))
	let chart = new google.visualization.OrgChart(document.getElementById(divId))
	google.visualization.events.addListener(chart, 'ready', function () {
		const nodes = document.querySelectorAll('.google-visualization-orgchart-node')
		// console.log(nodes)
		nodes.forEach(node => {
			let oldVal = node.innerHTML
			if (oldVal) {
				let cleanVal = oldVal.replace(/_r[0-9]+/, '')
				node.innerHTML = cleanVal
				if (node.innerText.includes('true')) node.style.color = '#659B92'
				else if (node.innerText.includes('false')) node.style.color = '#FF8961'
			}
		})
	})
	chart.draw(data, { allowHtml: true })
}

const addEdges = function (node, g) {
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

const renderSamples = (samples, el, model, target, features) => {
	let element = document.getElementById(el)
	samples.forEach(sample => {
		let features_for_sample = features.map(feature => {
			return `${feature}: ${sample[feature]}`
		})
		element.innerHTML +=
			'<tr><td>' +
			features_for_sample.join(', </td><td>') +
			', </td><td> success: ' +
			sample[target] +
			' — </td><td style="color: #ffd6a5;"> predicted: ' +
			predict(model, sample) +
			'</td></tr>'
	})
}

let renderTrainingData = (train, el, target, features) => {
	let element = document.getElementById(el)
	train.forEach(item => {
		let renderFeature = features.map(feature => {
			return `${feature}: ${item[feature]}`
		})
		element.innerHTML += '<tr><td>' + renderFeature.join(', </td><td>') + ', </td><td> success: ' + item[target] + '</td></tr>'
	})
}

let calcError = function (samples, model, target) {
	let total = 0
	let correct = 0
	samples.forEach(sample => {
		total++
		let pred = predict(model, sample)
		let actual = sample[target]
		if (pred == actual) {
			correct++
		}
	})
	return correct / total > 1 ? 'error' : 'success'
}

const trainModel = id3(movies, 'success', features)
drawGraph(trainModel, 'canvas')

renderSamples(samples, 'samples', trainModel, 'success', features)
renderTrainingData(movies, 'training', 'success', features)

console.log(calcError(samples, trainModel, 'success'))
