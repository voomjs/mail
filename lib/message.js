class Message {
  /**
   * Create a new Message instance.
   *
   * @param {Object} server
   * @param {Object} driver
   */
  constructor (server, driver) {
    this.server = server
    this.driver = driver
    this.options = {}
  }

  /**
   * Get the formatted address.
   *
   * @param {String} address
   * @param {String} [name]
   * @return {Object}
   */
  address (address, name) {
    return name ? { address, name } : { address }
  }

  /**
   * Add a sender to the message.
   *
   * @param {String} address
   * @param {String} [name]
   * @return {Message}
   */
  from (address, name) {
    this.options.from = this.address(address, name)

    return this
  }

  /**
   * Add a recipient to the message.
   *
   * @param {String} address
   * @param {String} [name]
   * @return {Message}
   */
  to (address, name) {
    this.options.to = this.options.to || []
    this.options.to.push(this.address(address, name))

    return this
  }

  /**
   * Add a carbon copy to the message.
   *
   * @param {String} address
   * @param {String} [name]
   * @return {Message}
   */
  cc (address, name) {
    this.options.cc = this.options.cc || []
    this.options.cc.push(this.address(address, name))

    return this
  }

  /**
   * Add a blind carbon copy to the message.
   *
   * @param {String} address
   * @param {String} [name]
   * @return {Message}
   */
  bcc (address, name) {
    this.options.bcc = this.options.bcc || []
    this.options.bcc.push(this.address(address, name))

    return this
  }

  /**
   * Attach a file to the message.
   *
   * @param {Object} attachment
   * @return {Message}
   */
  attach (attachment) {
    this.options.attachments = this.options.attachments || []
    this.options.attachments.push(attachment)

    return this
  }

  /**
   * Set the subject of the message.
   *
   * @param {String} subject
   * @return {Message}
   */
  subject (subject) {
    this.options.subject = subject

    return this
  }

  /**
   * Set the priority of the message.
   *
   * @param {String} priority
   * @return {Message}
   */
  priority (priority) {
    this.options.priority = priority

    return this
  }

  /**
   * Set the text version of the message.
   *
   * @param {String} text
   * @return {Message}
   */
  text (text) {
    this.options.text = text

    return this
  }

  /**
   * Set the html version of the message.
   *
   * @param {String} html
   * @return {Message}
   */
  html (html) {
    this.options.html = html

    return this
  }

  /**
   * Set the view template of the message.
   *
   * @param {String} path
   * @param {Object} [context]
   * @return {Message}
   */
  view (path, context = {}) {
    this.viewPath = path
    this.viewContext = context

    return this
  }

  /**
   * Send the message.
   */
  async send () {
    const options = Object.assign({}, this.options)

    if (this.viewPath) {
      options.html = await this.server.render(this.viewPath, this.viewContext)
    }

    return this.driver.sendMail(options)
  }
}

module.exports = Message
