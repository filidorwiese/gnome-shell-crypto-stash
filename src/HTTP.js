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

const _userAgent = `${Local.metadata['name']}/${Local.metadata.tag}/Gnome ${Config.PACKAGE_VERSION} (${Local.metadata['url']})`
const _httpSession = new Soup.SessionAsync()
_httpSession['user-agent'] = _userAgent

Soup.Session.prototype.add_feature.call(
  _httpSession,
  new Soup.ProxyResolverDefault()
)

var getJSON = (url, callback) => {
  let message = Soup.Message.new('GET', url)
  let headers = message.request_headers
  headers.append('X-Client', _userAgent)
  _httpSession.queue_message(
    message,
    (session, message) => {
      if (message.status_code === 200) {
        let data
        try {
          data = JSON.parse(message.response_body.data)
        } catch (e) {
          callback(
            new Error(`GET ${url}: error parsing JSON: ${e}`), null
          )
        }
        if (data) {
          callback(null, data)
        }
      } else {
        callback(new HTTPError(message), null)
      }
    }
  )
}
