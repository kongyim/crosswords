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

      if (question[0] != question[0].toUpperCase()) {
        logger.warn('%s, first letter is not captital', question);
      }

      if (answer != answer.toLowerCase()) {
        logger.warn('%s, is not all lower case', answer);
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

cloneMatrix = (matrix)=>{
  let result = []
  _.each(matrix, (row, y)=>{
    _.each(row, (col, x)=>{
      _.set(result, `[${y}][${x}]`, col)
    })
  })
  return result
}

check = (matrix, x, y, dir, item, isFirst)=> {
  let hitQuestions = [];
  let isOk = _.every(_.range(_.size(item.answer)), (i, idx)=>{
    let value = null
    if (dir) {
      value = _.get(matrix, `[${y+i}][${x}]`);
    } else {
      value = _.get(matrix, `[${y}][${x+i}]`);
    }
    if (value == undefined) return false
    if (isFirst) {
      return value == ''
    } else {
      if (value == '') return true
      if (value.letter == item.answer[idx]) {
        if (!_.find(hitQuestions, value.question)) {
          hitQuestions.push(value.question)
          return true
        }
        else {
          return false
        }
      }
      return false
    }
  })
  if (!isFirst && _.isEmpty(hitQuestions)) return false
  return isOk;
}

isMatrixValid = (matrix, current, oldQuestions, allQuestions)=> {
  let height = matrix.length;
  let width = _.head(matrix).length;
  let isOK;

  let newWordList = []
  isOK = _.every(_.range(height), (y)=>{
    let text = _.map(_.range(width), (x)=> {
      let col = _.get(matrix, `[${y}][${x}]`)
      return (col && col.letter ) || col || ' '
    }).join('')
    let list = _.filter(text.split(/[* ]/), (item)=> item.length>1);
    if (_.isEmpty(list)) return true;
    return _.every(list, (item)=> _.find(allQuestions, (quest)=> quest.answer == item ))
  })
  if (!isOK) return false

  isOK = _.every(_.range(width), (x)=>{
    let text = _.map(_.range(height), (y)=> {
      let col = _.get(matrix, `[${y}][${x}]`)
      return (col && col.letter ) || col || ' '
    }).join('')
    let list = _.filter(text.split(/[* ]/), (item)=> item.length>1);
    if (_.isEmpty(list)) return true;
    return _.every(list, (item)=> _.find(allQuestions, (quest)=> quest.answer == item ))
  })
  if (!isOK) return false

  if (!_.isEmpty(newWordList)){
    logger.warn(newWordList)
  }

  return true
}

generatePuzzle = (width, height, questions)=> {
  let matrix = _.map(_.range(height), ()=> _.fill(_.range(width), ''));
  questions = _.shuffle(questions);
  // questions = _.take(questions, 20);

  let remainQuestions = _.clone(questions);
  let isFirst = true
  let outputQuestions = []
  _.every(questions, ()=>{
    let lastMatrix = matrix;
    _.some(remainQuestions, (quest, idx)=>{
      let size = _.size(quest.answer)
      return _.some(_.shuffle(_.range(height)), (y)=>{
        return _.some(_.shuffle(_.range(width)), (x)=>{
          return _.some([0, 1], (dir)=>{
            if (check(matrix, x, y, dir, quest, isFirst)) {
              let newMatrix = cloneMatrix(matrix)
              _.each(_.range(size), (i)=>{
                let data = {letter:quest.answer[i], question: quest}
                if (dir) {
                  _.set(newMatrix, `[${y+i}][${x}]`, data);
                } else {
                  _.set(newMatrix, `[${y}][${x+i}]`, data);
                }
              })

              if (dir) {
                if (_.get(newMatrix, `[${y-1}][${x}]`)=='') _.set(newMatrix, `[${y-1}][${x}]`, '*');
                if (_.get(newMatrix, `[${y+size}][${x}]`)=='') _.set(newMatrix, `[${y+size}][${x}]`, '*');
              } else {
                if (_.get(newMatrix, `[${y}][${x-1}]`)=='') _.set(newMatrix, `[${y}][${x-1}]`, '*');
                if (_.get(newMatrix, `[${y}][${x+size}]`)=='') _.set(newMatrix, `[${y}][${x+size}]`, '*');
              }

              let outputItem = {question: quest, x, y, dir}
              if (isMatrixValid(newMatrix, outputItem, outputQuestions, questions))
              {
                _.remove(remainQuestions, quest);
                outputQuestions.push(outputItem);
                isFirst = false;
                matrix = newMatrix
                return true
              }
              return false
            }
            return false
          })
        })
      })
    })
    if (lastMatrix == matrix) return false
    return true
  })

  outputQuestions = _.sortBy(outputQuestions, (item)=> item.dir*1000000 + item.y * 1000 + item.x)

  return {
    matrix,
    questions: outputQuestions
  }
}

printMatrix = (matrix)=> {
 _.each(matrix, (row)=>{
   _.each(row, (col)=>{
    if (col == '*') col = ' '
    process.stdout.write((col && col.letter ) || col || ' ' )
    process.stdout.write(' ')
   })
   console.log('')
 })
}

exports = module.exports = {
  loadQuestionJson,
  generateQuestionJson,
  generatePuzzle,
  printMatrix
}