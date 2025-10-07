# CryptoStash

A GNOME Shell extension to track the real-time value of your cryptocurrency portfolios directly from your desktop panel.

## ✨ Features

- **Multiple Portfolios**: Create and track multiple "stashes" (portfolios) with custom coin collections
- **Near Real-time Pricing**: Live cryptocurrency prices updated automatically once per hour
- **Multi-currency Support**: Display values in USD or EUR
- **Flexible Display**: Show portfolio totals or individual coin prices
- **Top Panel Integration**: Cryptocurrency data at a glance in your GNOME panel
- **Privacy-focused**: All calculations happen locally on your device

## 📸 Screenshots

### Portfolio View
Monitor your complete portfolio with accumulated values in your preferred currency:

<img src="https://raw.githubusercontent.com/filidorwiese/gnome-shell-crypto-stash/main/screens/extension1.png">

### Single Coin Tracking
Track individual cryptocurrency prices:

<img src="https://raw.githubusercontent.com/filidorwiese/gnome-shell-crypto-stash/main/screens/extension2.png">

### Configuration
Easy-to-use settings panel for managing your stashes:

<img src="https://raw.githubusercontent.com/filidorwiese/gnome-shell-crypto-stash/main/screens/preferences.png">

## 🔧 Installation

### Method 1: GNOME Extensions Website (Recommended)

1. Visit [extensions.gnome.org/extension/4276/cryptostash/](https://extensions.gnome.org/extension/4276/cryptostash/)
2. Toggle the extension to "On"
3. Restart GNOME Shell (Press `Alt+F2`, type `r`, press Enter)

### Method 2: Manual Installation

**Prerequisites**: `git`, `jq`, `zip`, and `make` must be installed on your system.

```bash
git clone https://github.com/filidorwiese/gnome-shell-crypto-stash.git
cd gnome-shell-crypto-stash
make install
```

After installation, restart GNOME Shell and enable the extension:
```bash
gnome-extensions enable cryptostash@filidorwiese.nl
```

## 🚀 Getting Started

1. **Open Settings**: Click on the CryptoStash indicator in your panel and select "Settings"
2. **Create a Stash**: Add a new portfolio by clicking the "+" button
3. **Add Coins**:
   - Select a cryptocurrency from the dropdown
   - Enter the amount you own
   - Click "Add" to include it in your stash
4. **Configure Display**: Choose between portfolio view or single coin tracking

## 📋 Compatibility

| GNOME Shell Version | Status |
|---------------------|---------|
| 40 and below | ❌ Not supported |
| 43 | ✅ Fully supported |
| 44 | ✅ Fully supported |
| 45 | ✅ Fully supported |
| 46 | ✅ Fully supported |
| 47 | ✅ Fully supported |

## 🐛 Troubleshooting

### Extension doesn't appear after installation

1. **Check GNOME Shell version compatibility**:
   ```bash
   gnome-shell --version
   ```

2. **Verify installation location**:
   ```bash
   ls -la ~/.local/share/gnome-shell/extensions/cryptostash@filidorwiese.nl/
   ```

3. **Compile schemas manually** (if needed):
   ```bash
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/cryptostash@filidorwiese.nl/schemas/
   ```

4. **Check extension logs**:
   ```bash
   journalctl -f -o cat /usr/bin/gnome-shell
   ```

5. **Restart GNOME Shell**:
   - Press `Alt+F2`
   - Type `r` and press Enter
   - Or log out and log back in

## 🔒 Privacy & Data

We respect your privacy. Here’s how your data is handled:

- Rates for the top 100 coins (by market cap) are retrieved from filidorwiese.nl and refreshed about once per hour to provide near‑real‑time valuation.
- The extension fetches only public market rates; no personal or account credentials are requested or transmitted.
- All calculations and portfolio storage are performed locally on your device — nothing is sent elsewhere.

## 📄 License

This project is open source. See the repository for license details.

## 🙏 Credits

Inspired by Otto Allmendinger's [Bitcoin Markets](https://github.com/OttoAllmendinger/gnome-shell-bitcoin-markets/) extension.

## 🔗 Links

- [GNOME Extensions Page](https://extensions.gnome.org/extension/4276/cryptostash/)
- [GitHub Repository](https://github.com/filidorwiese/gnome-shell-crypto-stash)
- [Report Issues](https://github.com/filidorwiese/gnome-shell-crypto-stash/issues)
- [Author Website](https://filidorwiese.nl)
