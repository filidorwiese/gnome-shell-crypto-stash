const Lang = imports.lang
const Signals = imports.signals
const Mainloop = imports.mainloop

var IndicatorModel = new Lang.Class({
  Name: 'IndicatorModel',

  _init: function (handler, stash) {
    this._handler = handler
    this._stash = stash

    this._signalUpdateStart = handler.connect(
      'update-start', () => {
        this.emit('update-start')
      }
    )

    this._signalUpdateCryptoRates = handler.connect(
      'update-crypto-rates', (obj, error) => {
        this._triggerUpdate(error)
      }
    )

    this._signalUpdateCurrencyRates = handler.connect(
      'update-currency-rates', (obj, error) => {
        this._triggerUpdate(error)
      }
    )

    Mainloop.idle_add(() => {
      this._triggerUpdate()
    })
  },

  _triggerUpdate: function (error) {
    if (error) {
      this.emit('update', error, null)
    } else {
      if (this._handler.currencyRates && this._handler.cryptoRates) {
        this.emit('update', null, this._calculateStash())
      }
    }
  },

  _calculateStash: function () {
    const investment = this._stash.hasOwnProperty('investment') ? this._stash.investment : 0
    const stash = this._stash.assets.map((a) => {
      const amount = parseFloat(String(a.amount).replace(',', '.'))
      const assetRate = this._handler.cryptoRates.filter((c) => c.symbol === a.symbol)
      let assetPrice = assetRate.length ? parseFloat(assetRate[0].priceUsd) : 0

      if (this._stash.currency === 'EUR') {
        assetPrice /= parseFloat(this._handler.currencyRates.rateUsd)
      }

      return {
        asset: a.symbol,
        amount: amount,
        value: assetPrice,
        totalValue: assetPrice * amount
      }
    })

    const totalValue = stash.reduce((acc, a) => {
      return acc + a.totalValue
    }, 0) - investment

    let currencySymbol = '$'
    if (this._stash.currency === 'EUR') {
      currencySymbol = '€'
    }

    return {
      name: this._stash.name,
      investment,
      totalValue: parseInt(totalValue),
      currency: currencySymbol,
      stash,
    }
  },

  destroy: function () {
    this.disconnectAll()
    this._handler.disconnect(this._signalUpdateStart)
    this._handler.disconnect(this._signalUpdateCryptoRates)
    this._handler.disconnect(this._signalUpdateCurrencyRates)
  }
})

Signals.addSignalMethods(IndicatorModel.prototype)
