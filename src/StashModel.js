const Lang = imports.lang
const Signals = imports.signals
const Gtk = imports.gi.Gtk
const GObject = imports.gi.GObject

const Local = imports.misc.extensionUtils.getCurrentExtension()
const Convenience = Local.imports.convenience
const Globals = Local.imports.Globals

const ConfigModel = new Lang.Class({
  Name: 'ConfigModel',

  _init: function (attributes) {
    this.attributes = attributes
  },

  set: function (key, value) {
    this.attributes[key] = value
    this.emit('update', key, value)
  },

  get: function (key) {
    return this.attributes[key]
  },

  toString: function () {
    return JSON.stringify(this.attributes)
  },

  destroy: function () {
    this.disconnectAll()
  }
})

Signals.addSignalMethods(ConfigModel.prototype)

var StashModel = new GObject.Class({
  Name: 'CryptoStash.StashModel',
  GTypeName: 'StashModel',
  Extends: Gtk.ListStore,

  Columns: {
    LABEL: 0,
    CONFIG: 1
  },

  _init: function (params) {

    this.parent(params)

    this.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING])

    this._settings = Convenience.getSettings()

    this._reloadFromSettings()

    // this._settingsChangedId = this._settings.connect(
    //   'changed::' + Globals.STORAGE_KEY_STASHES,
    //   this._reloadFromSettings.bind(this)
    // );

    var flag

    let mutex = (func) =>
      function () {
        if (!flag) {
          flag = true
          func.apply(null, arguments)
          flag = false
        }
      }

    this.connect('row-changed', mutex(this._onRowChanged.bind(this)))

    this.connect('row-inserted', mutex(this._onRowInserted.bind(this)))

    this.connect('row-deleted', mutex(this._onRowDeleted.bind(this)))
  },

  getConfig: function (iter) {
    let json = this.get_value(iter, this.Columns.CONFIG)

    if (!json) {
      throw new Error('getConfig() failed for iter=' + iter)
    }

    let config = new ConfigModel(JSON.parse(json))

    config.connect('update', () => {
      this.set(
        iter,
        [this.Columns.CONFIG],
        [config.toString()]
      )
    })

    return config
  },

  _getLabel: function (config) {
    return config.name
  },

  _getDefaults: function () {
    return Globals.DEFAULT_STASH
  },

  _reloadFromSettings: function () {
    this.clear()

    let configs = this._settings.get_strv(Globals.STORAGE_KEY_STASHES)

    // Use a default stash if none have been created yet
    if (!configs || configs.length < 1) {
      configs = [JSON.stringify(Globals.DEFAULT_STASH)]
    }

    for (let key in configs) {
      let json = configs[key]
      try {
        let label = this._getLabel(JSON.parse(json))
        this.set(
          this.append(),
          [this.Columns.LABEL, this.Columns.CONFIG],
          [label, json]
        )
      } catch (e) {
        logError('error loading stash config: ' + e)
      }
    }
  },

  _writeSettings: function () {
    let [res, iter] = this.get_iter_first()
    let configs = []

    while (res) {
      configs.push(this.get_value(iter, this.Columns.CONFIG))
      res = this.iter_next(iter)
    }

    this._settings.set_strv(Globals.STORAGE_KEY_STASHES, configs)
  },

  _onRowChanged: function (self, path, iter) {
    let config = this.get_value(iter, this.Columns.CONFIG)

    this.set(
      iter,
      [this.Columns.LABEL, this.Columns.CONFIG],
      [this._getLabel(JSON.parse(config)), config]
    )

    this._writeSettings()
  },

  _onRowInserted: function (self, path, iter) {
    let defaults = this._getDefaults()

    this.set(
      iter,
      [this.Columns.LABEL, this.Columns.CONFIG],
      [this._getLabel(defaults), JSON.stringify(defaults)]
    )

    this._writeSettings()
  },

  _onRowDeleted: function (self, path, iter) {
    this._writeSettings()
  },

  destroy: function () {
    this._settings.disconnect(this._settingsChangedId)
  }
})
