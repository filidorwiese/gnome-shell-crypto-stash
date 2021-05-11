
var GET_CRYPTO_ASSETS_URL = 'https://api.coincap.io/v2/assets?limit=100';
var GET_CONVERSION_RATES_URL = 'https://api.coincap.io/v2/rates/euro';
var STORAGE_KEY_PORTFOLIOS = "portfolios";
var DEFAULT_PORTFOLIO = {
  name: 'New Portfolio',
  visible: true,
  currency: 'USD',
  assets: [
    {symbol: 'BTC', amount: 1},
  ]
}

var AVAILABLE_CURRENCIES = ['USD', 'EUR'];
