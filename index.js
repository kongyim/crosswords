let _ = require('lodash')
let log4js = require('log4js')
let fs = require('fs-extra')
let path = require('path')
let express = require('express')

let h = require('./lib/helper');
let pkg = require('./package.json')

let logger = log4js.getLogger();
logger.level = log4js.levels.DEBUG;

let txtFolder = path.join(__dirname, 'json');
let questionsFile = path.join(txtFolder, 'questions.json')

class ApiManager {

  constructor(config) {
    this.app = express()
    this.questions = []

    if (!fs.existsSync(questionsFile)){
      logger.info("generating question json")
      console.log('')
      h.generateQuestionJson(txtFolder, questionsFile)
    }

    this.questions = h.loadQuestionJson(questionsFile)
    this.initRoutes()
  }

  initRoutes() {
    this.app.get('/api/puzzle', (req, res, next)=>{
      let result = null
      do {
        result = h.generatePuzzle(5,5, this.questions);
      } while(result.questions.length < 5)
      // h.printMatrix(result.matrix)
      res.send(result.questions)
    })
  }

  express() {
    return this.app
  }
}




// let result = null
// do {
//   result = h.generatePuzzle(5,5, questions);
// } while(result.questions.length < 5)

// h.printMatrix(result.matrix)

// console.log(result.questions)

exports = module.exports = (config)=> {
  return new ApiManager(config)
}