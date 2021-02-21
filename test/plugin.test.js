require('dotenv/config')

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Hapi = require('@hapi/hapi')
const Hoek = require('@hapi/hoek')
const Wreck = require('@hapi/wreck')
const Vision = require('@hapi/vision')
const Mustache = require('mustache')

const Plugin = require('../lib')

const { expect } = Code
const { describe, it } = exports.lab = Lab.script()

const defaults = {
  connection: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  }
}

async function withServer (options = {}) {
  const server = Hapi.Server()

  await server.register({
    plugin: Vision,
    options: {
      path: 'test/views',
      engines: {
        html: {
          compile (template) {
            Mustache.parse(template)

            return (context) => Mustache.render(template, context)
          }
        }
      }
    }
  })

  await server.register({
    plugin: Plugin,
    options: Hoek.applyToDefaults(defaults, options)
  })

  return server
}

async function withClient (options = {}) {
  const headers = [options.user, options.pass].join(':')
  const encoded = Buffer.from(headers).toString('base64')

  const client = Wreck.defaults({
    json: true,
    baseUrl: 'http://localhost:8025',
    headers: { authorization: `Basic ${encoded}` }
  })

  async function emails () {
    const res = await client.get('/api/emails')
    await client.delete('/api/emails')

    return res
  }

  return { emails }
}

describe('plugin', function () {
  it('throws an error when options are missing', async function () {
    const server = Hapi.Server()

    await expect(server.register(Plugin)).to.reject()
  })

  it('throws an error when @hapi/vision is missing', async function () {
    const server = Hapi.Server()

    await server.register({
      plugin: Plugin,
      options: defaults
    })

    await expect(server.initialize()).to.reject()
  })

  it('exposes mail instance', async function () {
    const server = await withServer()

    expect(server.mail).to.be.a.function()

    server.route({
      method: 'GET',
      path: '/plugin',
      handler (request, h) {
        expect(request.mail).to.be.a.function()
        expect(request.mail()).to.be.equal(server.mail())

        return h.response().code(200)
      }
    })

    const res = await server.inject('/plugin')

    expect(res.statusCode).to.be.equal(200)
  })

  it('sends a message', async function () {
    const server = await withServer()
    const client = await withClient(defaults.connection.auth)

    await server.mail()
      .make()
      .to('spri@voom.to')
      .to('info@voom.to')
      .cc('spri@voom.cc')
      .cc('info@voom.cc')
      .bcc('spri@voom.bcc')
      .bcc('info@voom.bcc')
      .from('spri@voom.from', 'spri')
      .subject('welcome')
      .priority('high')
      .text('hello')
      .send()

    const { payload } = await client.emails()

    expect(payload).to.have.length(1)

    const [mail] = payload

    expect(mail.to.text).to.be.equal('spri@voom.to, info@voom.to')
    expect(mail.cc.text).to.be.equal('spri@voom.cc, info@voom.cc')
    expect(mail.from.text).to.be.equal('spri <spri@voom.from>')

    expect(mail.headers.subject).to.be.equal('welcome')
    expect(mail.headers.priority).to.be.equal('high')
  })

  it('sends a message with defaults', async function () {
    const server = await withServer({
      message: {
        from: 'spri@voom.from'
      }
    })

    const client = await withClient(defaults.connection.auth)

    await server.mail()
      .make()
      .to('spri@voom.to')
      .text('hello')
      .send()

    const { payload } = await client.emails()

    expect(payload).to.have.length(1)

    const [mail] = payload

    expect(mail.to.text).to.be.equal('spri@voom.to')
    expect(mail.from.text).to.be.equal('spri@voom.from')
  })

  it('sends a message with attachments', async function () {
    const server = await withServer()
    const client = await withClient(defaults.connection.auth)

    await server.mail()
      .make()
      .to('spri@voom.to')
      .from('spri@voom.from')
      .attach({ filename: 'one.txt', content: 'hello' })
      .attach({ filename: 'two.txt', content: 'world' })
      .text('hello')
      .send()

    const { payload } = await client.emails()

    expect(payload).to.have.length(1)

    const [mail] = payload

    expect(mail.attachments).to.have.length(2)

    const [one, two] = mail.attachments

    expect(one.filename).to.be.equal('one.txt')
    expect(two.filename).to.be.equal('two.txt')
  })

  it('sends a message with custom text', async function () {
    const server = await withServer()
    const client = await withClient(defaults.connection.auth)

    await server.mail()
      .make()
      .to('spri@voom.to')
      .from('spri@voom.from')
      .text('hello')
      .send()

    const { payload } = await client.emails()

    expect(payload).to.have.length(1)

    const [mail] = payload

    expect(mail.html).to.be.false()
    expect(mail.text).to.contain('hello')
  })

  it('sends a message with custom html', async function () {
    const server = await withServer()
    const client = await withClient(defaults.connection.auth)

    await server.mail()
      .make()
      .to('spri@voom.to')
      .from('spri@voom.from')
      .html('<p>hello</p>')
      .send()

    const { payload } = await client.emails()

    expect(payload).to.have.length(1)

    const [mail] = payload

    expect(mail.html).to.contain('<p>hello</p>')
    expect(mail.text).to.contain('hello')
  })

  it('sends a message with custom view', async function () {
    const server = await withServer()
    const client = await withClient(defaults.connection.auth)

    await server.mail()
      .make()
      .to('spri@voom.to')
      .from('spri@voom.from')
      .view('welcome', { message: 'hello' })
      .send()

    const { payload } = await client.emails()

    expect(payload).to.have.length(1)

    const [mail] = payload

    expect(mail.html).to.contain('<p>hello</p>')
    expect(mail.text).to.contain('hello')
  })

  describe('connection', function () {
    it('does check connection by default', async function () {
      const server = await withServer({
        connection: {
          auth: {
            user: 'spri'
          }
        }
      })

      await expect(server.initialize()).to.reject()
    })

    it('does check connection when auto.connect is true', async function () {
      const server = await withServer({
        connection: {
          auth: {
            user: 'spri'
          }
        },
        auto: {
          connect: true
        }
      })

      await expect(server.initialize()).to.reject()
    })

    it('does not check connection when auto.connect is false', async function () {
      const server = await withServer({
        connection: {
          auth: {
            user: 'spri'
          }
        },
        auto: {
          connect: false
        }
      })

      await expect(server.initialize()).to.not.reject()
    })
  })

  describe('destruction', function () {
    it('does destroy connection by default', async function () {
      const server = await withServer()

      await server.initialize()

      server.ext('onPreStop', function () {
        expect(server.mail()).to.exist()
      })

      server.ext('onPostStop', async function () {
        await expect(server.mail().connect()).to.reject()
      })

      await server.stop()
    })

    it('does destroy connection when auto.destroy is true', async function () {
      const server = await withServer({ auto: { destroy: true } })

      await server.initialize()

      server.ext('onPreStop', function () {
        expect(server.mail()).to.exist()
      })

      server.ext('onPostStop', async function () {
        await expect(server.mail().connect()).to.reject()
      })

      await server.stop()
    })

    it('does not destroy connection when auto.destroy is false', async function () {
      const server = await withServer({ auto: { destroy: false } })

      await server.initialize()

      server.ext('onPreStop', function () {
        expect(server.mail()).to.exist()
      })

      server.ext('onPostStop', async function () {
        await expect(server.mail().connect()).to.not.reject()
      })

      await server.stop()
    })
  })
})
