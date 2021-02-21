# @voom/mail

#### SMTP wrapper for [Hapi](https://hapi.dev).

This plugin exposes a mail instance within your server.

The following operations can be performed automatically:

- Check the service connection on server startup and throw an error if the service is unreachable.
- Destroy the service connection on server shutdown.

This plugin requires [@hapi/vision](https://github.com/hapijs/vision) to render templates.

## Installation

```shell script
npm install @voom/mail
```

## Usage

```js
const Hapi = require('@hapi/hapi')
const Mail = require('@voom/mail')

async function start () {
  const server = Hapi.Server()

  await server.register({
    plugin: Mail,
    options: {
      connection: {
        host: '127.0.0.1',
        port: '1025',
        auth: {
          user: 'user',
          pass: 'pass'
        }
      },
      message: {
        from: 'spri@example.com'
      },
      auto: {
        connect: true,
        destroy: true
      }
    }
  })

  await server.start()

  // Create a new message
  const message = server.mail().make()

  // Add a recipient
  message.to('spri@example.com', 'spri')

  // Add a carbon copy
  message.cc('info@example.com')

  // Add a blind carbon copy
  message.bcc('secret@example.com')

  // Attach a file
  message.attach({ filename: 'invoice.txt', content: '$20' })

  // Set the subject and priority
  message.subject('welcome').priority('high')

  // Set the content
  message.text('welcome spri')
  message.html('<p>welcome spri</p>')
  message.view('views/welcome', { username: 'spri' })

  // Send the message
  await message.send()
}

start()
```
