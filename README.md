# CryptoStash

A gnome-shell extension to keep an eye on the real time value of your crypto collections.

You can create multiple "stashes" (portfolios) of coins and monitor the accumulated value in USD or EUR:

<img src="https://raw.githubusercontent.com/filidorwiese/gnome-shell-crypto-stash/main/screens/extension1.png">

Or if you prefer, you can simply track the current value of your favorite coin:

<img src="https://raw.githubusercontent.com/filidorwiese/gnome-shell-crypto-stash/main/screens/extension2.png">

Use the settings screen to configure your stashes:

<img src="https://raw.githubusercontent.com/filidorwiese/gnome-shell-crypto-stash/main/screens/preferences.png">

CryptoStash has been inspired on Otto
Allmendinger's [Bitcoin Markets](https://github.com/OttoAllmendinger/gnome-shell-bitcoin-markets/) extension.

## Installation

The recommended way to install is using the Gnome extensions website, go to https://extensions.gnome.org/extension/4276/cryptostash/ and toggle the extension to "On".

Alternatively you can clone this repo and install with `make install`. This method needs `git`, `jq`, `zip` and `make` to be installed on your system.

## Privacy notice
This extension uses the free [CoinCap.io](https://coincap.io/) api to retrieve:
- global averages of the top 100 crypto coins
- fiat conversion rates, for example USD->EUR

All calculations are done at the client-side. At no point will any crypto data stored by this extension leave your computer. But do note that your public ipaddress might be recorded by CoinCap.io.
