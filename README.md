# CryptoStash

A gnome-shell extension to keep an eye on the ever fluctuating value of your collection of crypto coins.

You can create separate "stashes" (portfolios) of coins and monitor the accumulate value in USD or EUR:

<img src="https://raw.githubusercontent.com/filidorwiese/gnome-shell-crypto-stash/main/screens/extension1.png">

Or if you prefer, simply keep an eye on the value of your favorite coin:

<img src="https://raw.githubusercontent.com/filidorwiese/gnome-shell-crypto-stash/main/screens/extension2.png">

You can freely configure stashes in the preferences screen:

<img src="https://raw.githubusercontent.com/filidorwiese/gnome-shell-crypto-stash/main/screens/preferences.png">

CryptoStash has been inspired on Otto
Allmendinger's [Bitcoin Markets](https://github.com/OttoAllmendinger/gnome-shell-bitcoin-markets/) extension.

## Installation

Find the extension on https://extensions.gnome.org to install.

## Privacy notice
This extension uses the free [CoinCap.io](https://coincap.io/) api to retrieve:
- global averages of the top 100 crypto coins
- fiat conversion rates, for example USD->EUR

All calculations are done at the client-side. At no point will any crypto data stored by this extension leave your computer. But do note that your public ipaddress might be recorded by CoinCap.io.
