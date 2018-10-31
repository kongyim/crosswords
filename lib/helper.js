let fs = require('fs-extra')
let log4js = require('log4js')
let _ = require('lodash')
let path = require('path')
let SpellChecker = require('spellchecker')

let logger = log4js.getLogger();
logger.level = log4js.levels.DEBUG;

generateQuestionJson = (txtFolder, questionsFile)=> {
  let questions = []
  let files = fs.readdirSync(txtFolder)
  let txtFiles = _.filter(files, (item)=> path.extname(item) == ".txt")

  _.each(txtFiles, (file)=>{
    let content = fs.readFileSync(path.join(txtFolder, file), "utf-8");
    let lines = content.split(/[\r\n]+/);
    lines = _.compact(lines)

    _.each(_.range(_.ceil(lines.length/2)), (i)=>{
      let question = lines[i*2]
      let answer = lines[i*2+1]
      // console.log( i, question, "---", answer)
      if (question[0] != question[0].toUpperCase()) {
        logger.warn('%s, first letter is not captital', question);
      }
      _.each([question, answer], (text)=>{
        let check = SpellChecker.checkSpelling(text);
        if (!_.isEmpty(check)) {
          logger.warn(text, check)
        }
      })
      questions.push({question, answer})
    })

    fs.writeJsonSync(questionsFile, questions, {spaces: '  '})
    // console.log(questions)
  })
}

loadQuestionJson = (questionsFile)=>{
  let questions = fs.readJsonSync(questionsFile)

  _.each(['question', 'answer'], (field)=>{
    let reverseField = field=='answer'? 'question': 'answer'
    let map = _.groupBy(questions, field);
    map = _.pickBy(map, (value)=>{
      return value.length > 1
    })
    if(!_.isEmpty(map)){
      _.each(map, (items, key)=>{
        logger.info('%s has multiple %ss', key, reverseField)
        _.each(items, item=>{
          logger.info(item[reverseField])
        })
        console.log('')
      })
    }
  })

  return questions;
}

check = (matrix, x, y, dir, item)=> {
  return _.every(_.range(_.size(item.answer)), (i)=>{
    let value = null
    if (dir) {
      value = _.get(matrix, `[${y+i}][${x}]`);
    } else {
      value = _.get(matrix, `[${y}][${x+i}]`);
    }
    return value == ''
  })
}

generatePuzzle = (width, height, questions)=> {
  let matrix = _.map(_.range(height), ()=> _.fill(_.range(width), ''));
  questions = _.shuffle(questions);
  firstQuestion = _.head(questions);

  _.some(_.shuffle(_.range(height)), (y)=>{
    return _.some(_.shuffle(_.range(width)), (x)=>{
      return _.some([0, 1], (dir)=>{
        if (check(matrix, x, y, dir, firstQuestion)) {
          _.each(_.range(_.size(firstQuestion.answer)), (i)=>{
            if (dir) {
              _.set(matrix, `[${y+i}][${x}]`, firstQuestion.answer[i]);
            } else {
              _.set(matrix, `[${y}][${x+i}]`, firstQuestion.answer[i]);
            }
          })
          return true
        }
        return false
      })
    })
  })
  // let x = _.random(width);
  // let y = _.random(height);


  // _.each(questions, (item)=> {

  //   tryPut
  //   check(matrix, x, y, item)


  // })
  return matrix
}

exports = module.exports = {
  loadQuestionJson,
  generateQuestionJson,
  generatePuzzle
}