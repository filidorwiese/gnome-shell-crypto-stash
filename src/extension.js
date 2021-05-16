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

    this._popupItemTitle = new PopupMenu.PopupMenuItem(
      '', {activate: false, hover: false, can_focus: false}
    )
    this._popupItemTitle.label.set_style('max-width: 400px;')
    this._popupItemTitle.label.clutter_text.set_line_wrap(true)
    this._popupItemTitle.label.clutter_text.set_use_markup(true)
    this.menu.addMenuItem(this._popupItemTitle)

    this._popupItemBreakdown = new PopupMenu.PopupMenuItem(
      '', {activate: false, hover: false, can_focus: false}
    )
    this._popupItemBreakdown.label.set_style('max-width: 400px; font-size:12px;')
    this._popupItemBreakdown.label.clutter_text.set_line_wrap(true)
    this._popupItemBreakdown.label.clutter_text.set_use_markup(true)
    this.menu.addMenuItem(this._popupItemBreakdown)

    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem())

    this._popupItemSettings = new PopupMenu.PopupMenuItem('⚙ Settings...')
    this.menu.addMenuItem(this._popupItemSettings)
    this._popupItemSettings.connect('activate', () => {
      Util.spawn(['gnome-extensions', 'prefs', Local.metadata.uuid])
    })
  },

  _initBehavior: function () {
    this._model = new IndicatorModel(this._api, this._stash)

    this._model.connect('update-start', () => {
      this._displayStatus(Globals.SYMBOLS.refresh)
    })

    this._model.connect('update', (obj, err, stash) => {
      if (err) {
        this._showError(err)
      } else {
        this._showData(stash)
      }
    })

    this._displayStatus(Globals.SYMBOLS.refresh)
  },

  _showError: function () {
    this._displayStatus(Globals.SYMBOLS.error)
  },

  _showData: function (stash) {
    this._displayText(stash.currency + ' ' + stash.totalValue)
    this._displayStatus(Globals.SYMBOLS.wallet)
    this._popupItemTitle.label.clutter_text.set_markup(`${Globals.SYMBOLS.wallet} <b>${stash.name}</b>`)

    const breakdown = stash.stash.map((c) => {
      const left = `${c.amount.toFixed(3)} ${c.asset} × ${stash.currency} ${c.value.toFixed(2)}`
      const right = `${stash.currency} ${c.totalValue.toFixed(0)}`
      return `<span font_family="monospace">${left}\t= ${right}</span>`
    });

    if (stash.investment > 0) {
      breakdown.push(`<span font_family="monospace">Investment\t\t= ${stash.currency} ${stash.investment * -1}</span>`)
    }

    this._popupItemBreakdown.label.clutter_text.set_markup(breakdown.join('\n'))
  },

  _displayStatus: function (text) {
    this._statusView.text = text
  },

  _displayText: function (text) {
    this._indicatorView.text = text
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
      .filter((s) => s.visible)

    if (indicators.length) {
      _api.startPolling()
      indicators.forEach((s) => {
        try {
          this.add(new StashIndicaterView(s))
        } catch (e) {
          logError('error creating indicator: ' + e)
        }
      })
    } else {
      _api.stopPolling()
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
