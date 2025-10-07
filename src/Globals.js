var GET_CRYPTO_RATES_URL = 'https://cryptostash.filidorwiese.nl/coins.json'

var GET_FIAT_RATES_URL = 'https://cryptostash.filidorwiese.nl/rates.json'

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
