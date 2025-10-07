imports.gi.versions.Soup = '3.0'
const Soup = imports.gi.Soup
const Local = imports.misc.extensionUtils.getCurrentExtension()
const Config = imports.misc.config

function HTTPError (soupMessage, error) {
  this.name = 'HTTPError'
  this.soupMessage = soupMessage
  this.stack = (new Error()).stack

  this.toString = () =>
    'method=' + this.soupMessage.method +
    ' uri=' + this.soupMessage.uri.to_string(false /* short */) +
    ' status_code=' + this.soupMessage.status_code +
    ' reason_phrase= ' + this.soupMessage.reason_phrase
}

HTTPError.prototype = Object.create(Error.prototype)
HTTPError.prototype.constructor = HTTPError

const STATUS_TOO_MANY_REQUESTS = 429

var isErrTooManyRequests = (err) =>
  err &&
  err.soupMessage &&
  err.soupMessage.status_code &&
  Number(err.soupMessage.status_code) === STATUS_TOO_MANY_REQUESTS

const _userAgent = `${Local.metadata['name']}/${String(Local.metadata.tag)}/Gnome ${Config.PACKAGE_VERSION} (${Local.metadata['url']})`
const _httpSession = new Soup.Session()
_httpSession['user-agent'] = _userAgent

// ProxyResolverDefault is deprecated, proxy resolution is automatic in modern libsoup

var getJSON = (url, callback) => {
  let message = Soup.Message.new('GET', url)
  let headers = message.request_headers
  headers.append('X-Client', _userAgent)

  // Use send_and_read_async for libsoup 3.x
  _httpSession.send_and_read_async(
    message,
    0,
    null,
    (session, result) => {
      try {
        let bytes = session.send_and_read_finish(result)

        if (message.status_code === 200) {
          let decoder = new TextDecoder('utf-8')
          let text = decoder.decode(bytes.get_data())

          let data
          try {
            data = JSON.parse(text)
          } catch (e) {
            callback(
              new Error(`GET ${url}: error parsing JSON: ${e}`), null
            )
            return
          }
          callback(null, data)
        } else {
          callback(new HTTPError(message), null)
        }
      } catch (e) {
        callback(new Error(`GET ${url}: ${e}`), null)
      }
    }
  )
}
