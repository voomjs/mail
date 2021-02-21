const Joi = require('joi')
const Mail = require('./mail')

class Plugin {
  /**
   * Plugin package.
   *
   * @return {Object}
   */
  static get package () {
    return require('../package.json')
  }

  /**
   * Plugin registration.
   *
   * @param {...Object} options
   */
  static async register (...options) {
    return new Plugin(...options).register()
  }

  /**
   * Plugin as Object.
   *
   * @return {Object}
   */
  static asObject () {
    return { pkg: this.package, register: this.register }
  }

  /**
   * Create a new Plugin instance.
   *
   * @param {Object} server
   * @param {Object} options
   */
  constructor (server, options) {
    this.server = server
    this.options = Joi.attempt(options, this.schema)
  }

  /**
   * Plugin instance registration.
   */
  async register () {
    this.mail = new Mail(this.server, this.options)

    this.server.decorate('server', 'mail', () => this.mail)
    this.server.decorate('request', 'mail', () => this.mail)

    this.server.ext('onPreStart', this.onPreStart, { bind: this })
    this.server.ext('onPostStop', this.onPostStop, { bind: this })

    this.server.dependency('@hapi/vision')
  }

  /**
   * Handle pre-start event.
   *
   * @param {Object} server
   */
  async onPreStart (server) {
    await this.connect(server)
  }

  /**
   * Handle post-stop event.
   *
   * @param {Object} server
   */
  async onPostStop (server) {
    await this.destroy(server)
  }

  /**
   * Check service connection.
   *
   * @param {Object} server
   */
  async connect (server) {
    if (this.auto('connect')) {
      await server.mail().connect()
    }
  }

  /**
   * Destroy service connection.
   *
   * @param {Object} server
   */
  async destroy (server) {
    if (this.auto('destroy')) {
      await server.mail().destroy()
    }
  }

  /**
   * Determine if the given action should be executed.
   *
   * @param {String} action
   * @return {Boolean}
   */
  auto (action) {
    return this.options.auto[action]
  }

  /**
   * Options schema.
   *
   * @return {Object}
   */
  get schema () {
    return Joi.object({
      connection: Joi.object().required(),
      message: Joi.object(),
      auto: Joi.object().default().keys({
        connect: Joi.boolean().default(true),
        destroy: Joi.boolean().default(true)
      })
    })
  }
}

module.exports = Plugin
