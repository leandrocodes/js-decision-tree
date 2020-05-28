const decisionTree = DecisionTree()

let success

const id3 = decisionTree.create({
    origin: 'br',
    bigStar: false,
    genre: 'comedy'
})

id3.addQuestion(
    'origin',
    id3 => id3.origin == 'br',
    () => {
        success = false
    },
    () => {
        success = false
    },
    () => {
        success = false
    }
)

console.log(id3, success)
