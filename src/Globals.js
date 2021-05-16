var GET_CRYPTO_ASSETS_URL = 'https://api.coincap.io/v2/assets?limit=100'
var GET_CONVERSION_RATES_URL = 'https://api.coincap.io/v2/rates/euro'
var STORAGE_KEY_STASHES = 'stashes'
var DEFAULT_STASH = {
  name: 'New Stash',
  visible: true,
  currency: 'USD',
  investment: 0,
  assets: [
    {symbol: 'BTC', amount: 1},
  ]
}

var AVAILABLE_CURRENCIES = ['USD', 'EUR']
var SYMBOLS = {
  error: '\u26A0',
  refresh: '\u27f3',
  wallet: '👛'
}
