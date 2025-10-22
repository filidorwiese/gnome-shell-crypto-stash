export const GET_CRYPTO_RATES_URL = 'https://cryptostash.filidorwiese.nl/coins.json';

export const GET_FIAT_RATES_URL = 'https://cryptostash.filidorwiese.nl/rates.json';

export const STORAGE_KEY_STASHES = 'stashes';

export const DEFAULT_STASH = {
  name: 'New Stash',
  visible: true,
  currency: 'USD',
  investment: 0,
  assets: [
    {symbol: 'BTC', amount: 1},
  ]
};

export const AVAILABLE_CURRENCIES = ['USD', 'EUR'];

export const SYMBOLS = {
  error: '\u26A0',
  refresh: '\u27f3',
  wallet: '👛'
};
