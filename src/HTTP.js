import Soup from 'gi://Soup?version=3.0';
import GLib from 'gi://GLib';

export class HTTPError extends Error {
  constructor(soupMessage) {
    super();
    this.name = 'HTTPError';
    this.soupMessage = soupMessage;
    this.stack = (new Error()).stack;
  }

  toString() {
    return 'method=' + this.soupMessage.method +
      ' uri=' + this.soupMessage.uri.to_string(false /* short */) +
      ' status_code=' + this.soupMessage.status_code +
      ' reason_phrase= ' + this.soupMessage.reason_phrase;
  }
}

const STATUS_TOO_MANY_REQUESTS = 429;

export const isErrTooManyRequests = (err) =>
  err &&
  err.soupMessage &&
  err.soupMessage.status_code &&
  Number(err.soupMessage.status_code) === STATUS_TOO_MANY_REQUESTS;

// HTTP session management - not initialized at global scope
let _httpSession = null;
let _userAgent = null;

export const init = (metadata, packageVersion = 'Unknown') => {
  if (!_httpSession) {
    _userAgent = `${metadata['name']}/${String(metadata.tag)}/Gnome ${packageVersion} (${metadata['url']})`;
    _httpSession = new Soup.Session();
    _httpSession['user-agent'] = _userAgent;
  }
};

export const destroy = () => {
  if (_httpSession) {
    _httpSession.abort();
    _httpSession = null;
    _userAgent = null;
  }
};

export const getJSON = (url, callback) => {
  // Ensure session is initialized
  if (!_httpSession) {
    throw new Error('HTTP module not initialized. Call init() first.');
  }

  let message = Soup.Message.new('GET', url);
  let headers = message.request_headers;
  headers.append('X-Client', _userAgent);

  // Use send_and_read_async for libsoup 3.x
  _httpSession.send_and_read_async(
    message,
    GLib.PRIORITY_DEFAULT,
    null,
    (session, result) => {
      try {
        let bytes = session.send_and_read_finish(result);

        if (message.status_code === 200) {
          let decoder = new TextDecoder('utf-8');
          let text = decoder.decode(bytes.get_data());

          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            callback(
              new Error(`GET ${url}: error parsing JSON: ${e}`), null
            );
            return;
          }
          callback(null, data);
        } else {
          callback(new HTTPError(message), null);
        }
      } catch (e) {
        callback(new Error(`GET ${url}: ${e}`), null);
      }
    }
  );
};
