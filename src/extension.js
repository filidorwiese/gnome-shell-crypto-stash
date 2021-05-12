const Lang = imports.lang
const St = imports.gi.St
const Clutter = imports.gi.Clutter
const Util = imports.misc.util
const Main = imports.ui.main
const PanelMenu = imports.ui.panelMenu
const PopupMenu = imports.ui.popupMenu

const Local = imports.misc.extensionUtils.getCurrentExtension()
const Convenience = Local.imports.convenience
const Globals = Local.imports.Globals
const CoinCapApi = Local.imports.CoinCapApi
const IndicatorModel = Local.imports.IndicatorModel.IndicatorModel

const _Symbols = {
  error: '\u26A0',
  refresh: '\u27f3',
  wallet: '👛'
}

let _indicatorCollection
let _api

function init (metadata) {}

function enable () {
  try {
    _api = new CoinCapApi.CoinCapApi()

    _indicatorCollection = new IndicatorCollection()
  } catch (e) {
    logError(e)
  }
}

function disable () {
  _indicatorCollection.destroy()
  _api.destroy()
}

const StashIndicaterView = new Lang.Class({
  Name: 'StashIndicaterView',
  Extends: PanelMenu.Button,

  _init: function (stash) {
    this.parent(0)
    this._stash = stash
    this._api = _api

    log(JSON.stringify(stash))
    this._initLayout()
    this._initBehavior()
  },

  _initLayout: function () {
    let layout = new St.BoxLayout()

    this._indicatorView = new St.Label({
      y_align: Clutter.ActorAlign.CENTER,
      style_class: 'indicator'
    })

    this._statusView = new St.Label({
      y_align: Clutter.ActorAlign.CENTER,
      style_class: 'status'
    })

    layout.add_actor(this._statusView)
    layout.add_actor(this._indicatorView)

    this.add_actor(layout)

    this._popupItemStatus = new PopupMenu.PopupMenuItem(
      '', {activate: false, hover: false, can_focus: false}
    )
    this._popupItemStatus.label.set_style('max-width: 400px;font-size:10px;')
    this._popupItemStatus.label.clutter_text.set_line_wrap(true)
    this.menu.addMenuItem(this._popupItemStatus)

    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem())

    this._popupItemSettings = new PopupMenu.PopupMenuItem('⚙ CryptoStash Settings')
    this.menu.addMenuItem(this._popupItemSettings)
    this._popupItemSettings.connect('activate', () => {
      Util.spawn(['gnome-extensions', 'prefs', Local.metadata.uuid])
    })
  },

  _initBehavior: function () {
    this._model = new IndicatorModel(this._api, this._stash)

    this._model.connect('update-start', () => {
      log('extension.js: update-start')
      this._displayStatus(_Symbols.refresh)
    })

    this._model.connect('update', (obj, err, stash) => {
      log('extension.js: update')
      log(JSON.stringify(stash))
      if (err) {
        this._showError(err)
      } else {
        this._showData(stash)
      }

      // this._updatePopupItemLabel(err, stash)
    })

    this._displayStatus(_Symbols.refresh)
  },

  _showError: function (error) {
    log('err ' + JSON.stringify(error))
    this._displayText('error')
    this._displayStatus(_Symbols.error)
    this._popupItemStatus.text = 'error'
    log('extension.js: _showError')
  },

  _showData: function (stash) {
    log('extension.js: _showData')

    this._displayText(stash.currency + ' ' + stash.totalValue)
    this._displayStatus(_Symbols.wallet)
    this._popupItemStatus.label.text = `👛  ${stash.name}\n\n${stash.stash.map((c) => {
      return `${c.amount} x ${c.asset}\t\t${c.value} = ${c.totalValue}`
    }).join('\n')}`

    // let _StatusToSymbol = {
    //   up: _Symbols.up,
    //   down: _Symbols.down,
    //   unchanged: " "
    // };

    // let {text} = data;
    // if (this._options.show_base_currency) {
    //   text += "/" + this._options.coin;
    // }
    // this._displayText(text);
    //
    // let symbol = " ";
    //
    // if (this._options.show_change) {
    //   symbol = _StatusToSymbol[data.change];
    //   this._displayStatus(symbol);
    // } else {
    //   this._statusView.width = 0;
    // }
  },

  _displayStatus: function (text) {
    this._statusView.text = text
  },

  _displayText: function (text) {
    this._indicatorView.text = text
  },

  _updatePopupItemLabel: function (err, data) {
    let text = 'Hello'//this._api.getLabel(this._options);
    if (err) {
      text += '\n\nError:\n' + String(err)
    }
    this._popupItemStatus.label.text = text
  },

  destroy: function () {
    this._model.destroy()
    this._indicatorView.destroy()
    this._statusView.destroy()

    this.parent()
  }
})

let IndicatorCollection = new Lang.Class({
  Name: 'IndicatorCollection',

  _init: function () {
    log('@@@ Loading')
    this._indicators = []
    this._settings = Convenience.getSettings()

    this._settingsChangedId = this._settings.connect(
      'changed::' + Globals.STORAGE_KEY_STASHES,
      this._createIndicators.bind(this)
    )

    this._createIndicators()
  },

  _createIndicators: function () {
    this._removeAll()

    let stashes = this._settings.get_strv(Globals.STORAGE_KEY_STASHES)

    // Use a default stash if none have been created yet
    if (!stashes || stashes.length < 1) {
      stashes = [JSON.stringify(Globals.DEFAULT_STASH)]
    }

    let indicators = stashes
      .map(JSON.parse)
      .filter((s) => s.visible);

    if (indicators.length) {
      _api.startPolling();
      indicators.forEach((s) => {
        try {
          this.add(new StashIndicaterView(s))
        } catch (e) {
          log('error creating indicator: ' + e)
        }
      })
    } else {
      _api.stopPolling();
    }
  },

  _removeAll: function () {
    this._indicators.forEach((i) => i.destroy())
    this._indicators = []
  },

  add: function (indicator) {
    this._indicators.push(indicator)
    let name = 'crypto-stash-indicator-' + this._indicators.length
    Main.panel.addToStatusArea(name, indicator)
  },

  destroy: function () {
    this._removeAll()
    this._settings.disconnect(this._settingsChangedId)
  }
})
