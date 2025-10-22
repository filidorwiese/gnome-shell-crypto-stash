import GObject from 'gi://GObject';
import GLib from 'gi://GLib';

import * as HTTP from './HTTP.js';
import * as Globals from './Globals.js';

const defaultInterval = 3600;

export const CryptoRatesApi = GObject.registerClass({
  GTypeName: 'CryptoRatesApi',
  Signals: {
    'update-start': {},
    'update-crypto-rates': {param_types: [GObject.TYPE_STRING]},
    'update-currency-rates': {param_types: [GObject.TYPE_STRING]},
  },
}, class CryptoRatesApi extends GObject.Object {
  constructor(metadata) {
    super();
    this.interval = defaultInterval;
    this.currencyRates = null;
    this.cryptoRates = null;
    this._metadata = metadata;
  }

  startPolling() {
    let loop = () => {
      this.emit('update-start');

      // Get crypto assets rates
      this.getCryptoRates((error, data) => {
        if (error) {
          if (HTTP.isErrTooManyRequests(error)) {
            logError(`${this._metadata['name']}: http error: too many requests`);
            this.interval *= 2;
          } else {
            logError(error);
          }
          this.emit('update-crypto-rates', 'api request failed');
        } else {
          if (data.hasOwnProperty('data') && data.data.length > 0) {
            this.cryptoRates = data.data;
            this.interval = defaultInterval;
            this.emit('update-crypto-rates', '');
          } else {
            logError('Crypto rates lookup error');
          }
        }
      });

      // Get currency conversion rates
      this.getFiatRates((error, data) => {
        if (error) {
          if (HTTP.isErrTooManyRequests(error)) {
            logError(`${this._metadata['name']}: http error: too many requests`);
            this.interval *= 2;
          } else {
            logError(error);
          }
          this.emit('update-currency-rates', 'api request failed');
        } else {
          if (data.hasOwnProperty('data') && data.data.hasOwnProperty('rateUsd')) {
            this.currencyRates = data.data;
            this.interval = defaultInterval;
            this.emit('update-currency-rates', '');
          } else {
            logError('USD/EUR rate lookup error');
          }
        }
      });

      this._signalTimeout = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT,
        this.interval,
        loop
      );

      return GLib.SOURCE_REMOVE;
    };

    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      loop();
      return GLib.SOURCE_REMOVE;
    });
  }

  getCryptoRates(callback) {
    HTTP.getJSON(Globals.GET_CRYPTO_RATES_URL, callback);
  }

  getFiatRates(callback) {
    HTTP.getJSON(Globals.GET_FIAT_RATES_URL, callback);
  }

  isPolling() {
    return typeof this._signalTimeout !== 'undefined';
  }

  stopPolling() {
    if (this._signalTimeout) {
      GLib.Source.remove(this._signalTimeout);
    }
  }

  destroy() {
    this.stopPolling();
    HTTP.destroy();
  }
});
