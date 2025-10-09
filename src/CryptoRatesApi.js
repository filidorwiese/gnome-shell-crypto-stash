const Signals = imports.signals
const GLib = imports.gi.GLib

const Local = imports.misc.extensionUtils.getCurrentExtension()
const HTTP = Local.imports.HTTP
const Globals = Local.imports.Globals

const defaultInterval = 3600

var CryptoRatesApi = class {
  constructor() {
    this.interval = defaultInterval
    this.currencyRates = null
    this.cryptoRates = null
  }

  startPolling() {
    let loop = () => {
      this.emit('update-start')

      // Get crypto assets rates
      this.getCryptoRates((error, data) => {
        if (error) {
          if (HTTP.isErrTooManyRequests(error)) {
            logError(`${Local.metadata['name']}: http error: too many requests`)
            this.interval *= 2
          } else {
            logError(error)
          }
          this.emit('update-crypto-rates', 'api request failed')
        } else {
          if (data.hasOwnProperty('data') && data.data.length > 0) {
            this.cryptoRates = data.data
            this.interval = defaultInterval
            this.emit('update-crypto-rates')
          } else {
            logError('Crypto rates lookup error')
          }
        }
      })

      // Get currency conversion rates
      this.getFiatRates((error, data) => {
        if (error) {
          if (HTTP.isErrTooManyRequests(error)) {
            logError(`${Local.metadata['name']}: http error: too many requests`)
            this.interval *= 2
          } else {
            logError(error)
          }
          this.emit('update-currency-rates', 'api request failed')
        } else {
          if (data.hasOwnProperty('data') && data.data.hasOwnProperty('rateUsd')) {
            this.currencyRates = data.data
            this.interval = defaultInterval
            this.emit('update-currency-rates')
          } else {
            logError('USD/EUR rate lookup error')
          }
        }
      })

      this._signalTimeout = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT,
        this.interval,
        loop
      )
    }

    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      loop()
      return GLib.SOURCE_REMOVE
    })
  }

  getCryptoRates(callback) {
    HTTP.getJSON(Globals.GET_CRYPTO_RATES_URL, callback)
  }

  getFiatRates(callback) {
    HTTP.getJSON(Globals.GET_FIAT_RATES_URL, callback)
  }

  isPolling() {
    return typeof this._signalTimeout !== 'undefined'
  }

  stopPolling() {
    if (this._signalTimeout) {
      GLib.Source.remove(this._signalTimeout)
    }
  }

  destroy() {
    this.stopPolling()
    HTTP.destroy()
  }
}

Signals.addSignalMethods(CryptoRatesApi.prototype)
