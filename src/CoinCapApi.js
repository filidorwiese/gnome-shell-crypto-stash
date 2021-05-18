const Lang = imports.lang
const Signals = imports.signals
const Mainloop = imports.mainloop

const Local = imports.misc.extensionUtils.getCurrentExtension()
const HTTP = Local.imports.HTTP
const Globals = Local.imports.Globals

const defaultInterval = 60

var CoinCapApi = new Lang.Class({
  Name: 'CoinCapApi',

  interval: defaultInterval,

  currencyRates: null,

  cryptoRates: null,

  _init: function () {},

  startPolling: function () {
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
          this.emit('update-crypto-rates', 'coincap.io api request failed')
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
      this.getCurrencyRates((error, data) => {
        if (error) {
          if (HTTP.isErrTooManyRequests(error)) {
            logError(`${Local.metadata['name']}: http error: too many requests`)
            this.interval *= 2
          } else {
            logError(error)
          }
          this.emit('update-currency-rates', 'coincap.io api request failed')
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

      this._signalTimeout = Mainloop.timeout_add_seconds(
        this.interval,
        loop
      )
    }

    Mainloop.idle_add(loop)
  },

  getCryptoRates: function (callback) {
    HTTP.getJSON(Globals.GET_CRYPTO_ASSETS_URL, callback)
  },

  getCurrencyRates: function (callback) {
    HTTP.getJSON(Globals.GET_CONVERSION_RATES_URL, callback)
  },

  isPolling: function() {
    return typeof this._signalTimeout !== 'undefined'
  },

  stopPolling: function () {
    if (this._signalTimeout) {
      Mainloop.source_remove(this._signalTimeout)
    }
  },

  destroy: function () {
    this.stopPolling()
  }
})

Signals.addSignalMethods(CoinCapApi.prototype)
