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

  disabled: false,

  errorCount: 0,

  currencyRates: null,

  cryptoRates: null,

  _init: function () {},

  startPolling: function () {
    log('start polling')
    let loop = () => {
      this.emit('update-start')

      // Get crypto assets rates
      this.getCryptoRates((error, data) => {
        if (error) {
          logError(error)
          this.errorCount++
        }

        if (HTTP.isErrTooManyRequests(error)) {
          log(`${Local.metadata['name']}: http error: too many requests - disabled updating`)
          this.errorCount++
        }

        if (data.hasOwnProperty('data') && data.data.length > 0) {
          this.cryptoRates = data.data;
          this.errorCount = 0
          this.interval = defaultInterval
          this.emit('update-crypto-rates', error, this.cryptoRates)
        } else {
          logError('Crypto rates lookup error')
          this.errorCount++
        }
      })

      // Get currency conversion rates
      this.getCurrencyRates((error, data) => {
        if (error) {
          logError(error)
          this.errorCount++
        }

        if (HTTP.isErrTooManyRequests(error)) {
          log(`${Local.metadata['name']}: http error: too many requests - disabled updating`)
          this.errorCount++
        }

        if (data.hasOwnProperty('data') && data.data.hasOwnProperty('rateUsd')) {
          this.currencyRates = data.data;
          this.errorCount = 0
          this.interval = defaultInterval
          this.emit('update-currency-rates', error, this.currencyRates)
        } else {
          logError('USD/EUR rate lookup error')
          this.errorCount++
        }
      })

      // Slow down
      if (this.errorCount > 0) {
        this.interval = 600
      }

      // Disable after 10 consecutive errors
      if (this.errorCount > 10) {
        this.disabled = true;
      }

      if (!this.disabled) {
        this._signalTimeout = Mainloop.timeout_add_seconds(
          this.interval, loop
        )
      }
    }

    Mainloop.idle_add(loop)
  },

  getCryptoRates: function (callback) {
    log('polling crypto rates')
    HTTP.getJSON(Globals.GET_CRYPTO_ASSETS_URL, callback)
  },

  getCurrencyRates: function (callback) {
    log('polling currency rates')
    HTTP.getJSON(Globals.GET_CONVERSION_RATES_URL, callback)
  },

  stopPolling: function() {
    log('stop polling')
    if (this._signalTimeout) {
      Mainloop.source_remove(this._signalTimeout)
    }
  },

  destroy: function () {
    this.stopPolling();
  }
})

Signals.addSignalMethods(CoinCapApi.prototype)
