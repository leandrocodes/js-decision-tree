//This file contains example training data and samples

//some sample data we'll be using
//http://www.cise.ufl.edu/~ddd/cap6635/Fall-97/Short-papers/2.htm
var examples = [
    {
        movie: 'movie1',
        originCountry: 'EUA',
        bigStar: true,
        movieGenre: 'cientific',
        success: true,
    },
    {
        movie: 'movie2',
        originCountry: 'EUA',
        bigStar: false,
        movieGenre: 'comedy',
        success: false,
    },
    {
        movie: 'movie3',
        originCountry: 'EUA',
        bigStar: true,
        movieGenre: 'comedy',
        success: true,
    },
    {
        movie: 'movie4',
        originCountry: 'EUR',
        bigStar: false,
        movieGenre: 'comedy',
        success: true,
    },
    {
        movie: 'movie5',
        originCountry: 'EUR',
        bigStar: true,
        movieGenre: 'cientific',
        success: false,
    },
    {
        movie: 'movie6',
        originCountry: 'EUR',
        bigStar: true,
        movieGenre: 'romance',
        success: false,
    },
    {
        movie: 'movie7',
        originCountry: 'BR',
        bigStar: true,
        movieGenre: 'comedy',
        success: false,
    },
    {
        movie: 'movie8',
        originCountry: 'BR',
        bigStar: false,
        movieGenre: 'cientific',
        success: false,
    },
    {
        movie: 'movie9',
        originCountry: 'EUR',
        bigStar: true,
        movieGenre: 'comedy',
        success: true,
    },
    {
        movie: 'movie10',
        originCountry: 'EUA',
        bigStar: true,
        movieGenre: 'comedy',
        success: true,
    },
]
// TODO: REMOVER UNDERSCORE
examples = _(examples)
var features = ['originCountry', 'bigStar', 'movieGenre']
var samples = [
    {
        originCountry: 'EUA',
        bigStar: false,
        movieGenre: 'comedy',
        success: false,
    },
    {
        originCountry: 'EUR',
        bigStar: true,
        movieGenre: 'romance',
        success: false,
    },
    {
        originCountry: 'EUR',
        bigStar: true,
        movieGenre: 'comedy',
        success: true,
    },
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
            alias: filterSets[0] + randomTag(),
        }
    }
    if (features.length == 0) {
        let topTarget = mostCommon(sets)
        return {
            type: 'result',
            val: topTarget,
            name: topTarget,
            alias: topTarget + randomTag(),
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

    var node = { name: bestFeature, alias: bestFeature + randomTag() }
    node.type = 'feature'

    node.vals = filterSets.map(filterSet => {
        // TODO: REMOVER UNDERSCORE
        let newDataSet = _(
            dataSet.filter(set => {
                if (set[bestFeature] == filterSet) return set
            })
        )
        let child_node = {
            name: filterSet,
            alias: filterSet + randomTag(),
            type: 'feature_value',
        }
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

    let attrVals = features.filter(
        (feature, index) => features.indexOf(feature) === index
    )

    // var attrVals = _.unique(dataSet.pluck(feature))
    let setEntropy = entropy(dataSet.map(set => set[target]))

    let setSize = dataSet.size()

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

var maxGain = (dataSet, target, features) => {
    return _.max(features, function (e) {
        return gain(dataSet, target, e)
    })
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
    var g = new Array()
    g = addEdges(id3Model, g).reverse()
    window.g = g
    var data = google.visualization.arrayToDataTable(g.concat(g))
    var chart = new google.visualization.OrgChart(
        document.getElementById(divId)
    )
    google.visualization.events.addListener(chart, 'ready', function () {
        const nodes = document.querySelectorAll(
            '.google-visualization-orgchart-node'
        )
        // console.log(nodes)
        nodes.forEach(node => {
            var oldVal = node.innerHTML
            if (oldVal) {
                var cleanVal = oldVal.replace(/_r[0-9]+/, '')
                node.innerHTML = cleanVal
                if (node.innerText.includes('true'))
                    node.style.color = '#659B92'
                else if (node.innerText.includes('false'))
                    node.style.color = '#FF8961'
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

// var renderTrainingData = function (_training, $el, target, features) {
//     _training.each(function (s) {
//         $el.append(
//             '<tr><td>' +
//                 _.map(features, function (x) {
//                     return s[x]
//                 }).join('</td><td>') +
//                 '</td><td>' +
//                 s[target] +
//                 '</td></tr>'
//         )
//     })
// }

var calcError = function (samples, model, target) {
    var total = 0
    var correct = 0
    samples.forEach(sample => {
        total++
        var pred = predict(model, sample)
        var actual = sample[target]
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
