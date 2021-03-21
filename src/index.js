const {CronJob} = require('cron')
const logger = require('./logger.js')
const fs = require('fs-extra')
const path = require('path')
const moment = require('moment')
const Twitter = require('./twitter.js')

const filePath = path.resolve(__dirname, '..', 'data.json')
let file = null

const twitter = new Twitter()

async function main() {
  logger.info('Starting bot!')
  logger.info('File path: ' + filePath)

  startCron()
}

async function startCron() {
  logger.info('Starting cron...')
  const job = new CronJob(process.env.CRON, () => {
    logger.info('Cron ticked.')
    try {
      check()
    } catch (e) {
      logger.error('Problem on cron tick:')
      console.error(e)
    }
  }, null, true, 'America/Sao_Paulo')
  job.start()
}

async function check() {
  const [data] = await twitter.getUser(process.env.USER_ID)

  const [, avatarID] = /https?:\/\/pbs.twimg.com\/profile_images\/([0-9]+)\/(.+)/g.exec(data.profile_image_url)

  logger.info(`Current avatar id: ${avatarID}`)

  const existsFile = await fs.exists(filePath)

  if (!existsFile) {
    logger.info('data.json doesn\'t exist. Creating file.')
    const savedData = {
      lastID: avatarID,
      lastProfileURL: data.profile_image_url,
      time: new Date().getTime(),
      highscore: 0
    }

    fs.writeJsonSync(filePath, savedData)
    logger.info('Update saved.')
  } else {
    const savedData = fs.readJsonSync(filePath)

    if (savedData.lastID === avatarID) {
      return logger.info('Avatar haven\'t changed.')
    } else {
      logger.info(`Avatar has changed: ${savedData.lastID} -> ${avatarID}`)
      const now = new Date().getTime()

      const diff = now - savedData.time

      const duration = formatDuration(diff)

      logger.info(`Change duration: ${duration}`)

      const {highscore} = fs.readJsonSync(filePath)

      const newData = {
        lastID: avatarID,
        lastProfileURL: data.profile_image_url,
        time: new Date().getTime(),
        highscore
      }

      let recordTaken = false

      if (diff > highscore) {
        recordTaken = true
        newData.highscore = diff
      }

      tweetChange(duration, data.profile_image_url, recordTaken, newData, highscore)

      fs.writeJsonSync(filePath, newData)
      logger.info('Update saved.')
    }
  }
}

async function tweetChange(duration, image, recordTaken, newData, oldScore) {

  const recordFormatted = formatDuration(newData.highscore)
  const lastRecordFormatted = formatDuration(oldScore)

  const status = recordTaken
    ? `Laura mudou de avatar após ${duration}!\n\n✨ NOVO RECORDE BATIDO ✨\nO último recorde foi de ${lastRecordFormatted}`
    : `Laura mudou de avatar após ${duration}!\n\nO recorde atual é de ${recordFormatted}`

  twitter.tweet({
    status: status
  })
}

function formatDuration (ms) {
  const durr = moment.utc(moment.utc(ms))
  const days = Number(durr.format('DDD')) - 1
  return days + durr.format(' [dia(s),] H [hora(s) e] m [minuto(s)]')
}

main()
