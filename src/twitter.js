const Twit = require('twit')

module.exports = class Twitter {
  constructor() {
    this.client = new Twit({
      consumer_key: process.env.TWT_KEY,
      consumer_secret: process.env.TWT_SECRET,
      access_token: process.env.TWT_ACCESS_TOKEN,
      access_token_secret: process.env.TWT_ACCESS_SECRET
    })
  }

  getUser (id) {
    return new Promise((resolve, reject) => {
      this.client.get('users/lookup', {
        user_id: id
      }, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }

  tweet (options) {
    return new Promise((resolve, reject) => {
      this.client.post('statuses/update', options, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }
}
