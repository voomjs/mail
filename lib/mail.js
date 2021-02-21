const Message = require('./message')
const Nodemailer = require('nodemailer')

class Mail {
  /**
   * Create a new Mail instance.
   *
   * @param {Object} server
   * @param {Object} options
   */
  constructor (server, options) {
    this.server = server
    this.driver = Nodemailer.createTransport(options.connection, options.message)
  }

  /**
   * Create a new Message instance.
   *
   * @return {Message}
   */
  make () {
    return new Message(this.server, this.driver)
  }

  /**
   * Check service connection.
   */
  async connect () {
    return this.driver.verify()
  }

  /**
   * Destroy service connection.
   */
  async destroy () {
    this.driver.close()
    this.driver = null
  }
}

module.exports = Mail
