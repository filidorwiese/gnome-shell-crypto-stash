import GObject from 'gi://GObject';
import GLib from 'gi://GLib';

export const IndicatorModel = GObject.registerClass({
  GTypeName: 'IndicatorModel',
  Signals: {
    'update-start': {},
    'update': {
      param_types: [GObject.TYPE_STRING, GObject.TYPE_STRING]
    },
  },
}, class IndicatorModel extends GObject.Object {
  constructor(handler, stash) {
    super();
    this._handler = handler;
    this._stash = stash;

    this._signalUpdateStart = handler.connect(
      'update-start', () => {
        this.emit('update-start');
      }
    );

    this._signalUpdateCryptoRates = handler.connect(
      'update-crypto-rates', (obj, error) => {
        this._triggerUpdate(error);
      }
    );

    this._signalUpdateCurrencyRates = handler.connect(
      'update-currency-rates', (obj, error) => {
        this._triggerUpdate(error);
      }
    );

    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      this._triggerUpdate('');
      return GLib.SOURCE_REMOVE;
    });
  }

  _triggerUpdate(error) {
    if (error) {
      this.emit('update', error || '', '');
    } else {
      if (this._handler.currencyRates && this._handler.cryptoRates) {
        this.emit('update', '', JSON.stringify(this._calculateStash()));
      }
    }
  }

  _calculateStash() {
    const investment = this._stash.hasOwnProperty('investment') ? this._stash.investment : 0;
    const stash = this._stash.assets.map((a) => {
      const amount = parseFloat(String(a.amount).replace(',', '.'));
      const assetRate = this._handler.cryptoRates.filter((c) => c.symbol === a.symbol);
      let assetPrice = assetRate.length ? parseFloat(assetRate[0].priceUsd) : 0;

      if (this._stash.currency === 'EUR') {
        assetPrice /= parseFloat(this._handler.currencyRates.rateUsd);
      }

      return {
        asset: a.symbol,
        amount: amount,
        value: assetPrice,
        totalValue: assetPrice * amount
      };
    });

    const totalValue = stash.reduce((acc, a) => {
      return acc + a.totalValue;
    }, 0) - investment;

    let currencySymbol = '$';
    if (this._stash.currency === 'EUR') {
      currencySymbol = '€';
    }

    return {
      name: this._stash.name,
      visible: this._stash.visible,
      investment,
      totalValue: totalValue,
      currency: currencySymbol,
      stash,
    };
  }

  destroy() {
    if (this._handler) {
      this._handler.disconnect(this._signalUpdateStart);
      this._handler.disconnect(this._signalUpdateCryptoRates);
      this._handler.disconnect(this._signalUpdateCurrencyRates);
    }
  }
});
