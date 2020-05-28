const DecisionTree = () => {
    return {
        create: movie => ({
            movie,
            questions: {},
            questionsArray: [],

            addQuestion(name, condition, callback1, callback2, callback3) {
                this.questions[name] = { condition, callback1, callback2, callback3 }
                this.questionsArray.push({ condition, callback1, callback2, callback3 })
            }
        })
    }
}
