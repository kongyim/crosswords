let _ = require('lodash')
let log4js = require('log4js')
let fs = require('fs-extra')
let path = require('path')

let logger = log4js.getLogger();
logger.level = log4js.levels.DEBUG;

let txtFolder = path.join(__dirname, 'json');
let questionsFile = path.join(txtFolder, 'questions.json')

let h = require('./lib/helper');


// console.log(files)
if (!fs.existsSync(questionsFile)){
  h.generateQuestionJson(txtFolder, questionsFile)
}

let questions = h.loadQuestionJson(questionsFile)

// console.log(questions)

let result = h.generatePuzzle(5,5, questions);
console.log(result)
