import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';

import * as Globals from './Globals.js';

export const ConfigModel = GObject.registerClass({
  GTypeName: 'ConfigModel',
  Signals: {
    'update': {
      param_types: [GObject.TYPE_STRING, GObject.TYPE_STRING]
    },
  },
}, class ConfigModel extends GObject.Object {
  constructor(attributes) {
    super();
    this.attributes = attributes;
  }

  set(key, value) {
    this.attributes[key] = value;
    this.emit('update', key, JSON.stringify(value));
  }

  get(key) {
    return this.attributes[key];
  }

  toString() {
    return JSON.stringify(this.attributes);
  }

  destroy() {
    // No signals to disconnect in GObject-based implementation
  }
});

export const StashModel = GObject.registerClass({
  GTypeName: 'StashModel',
  Properties: {},
}, class StashModel extends Gtk.ListStore {

  _init(settings) {

    super._init();

    // Define Columns as instance property
    this.Columns = {
      LABEL: 0,
      CONFIG: 1
    };

    this.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING]);

    this._settings = settings;

    this._reloadFromSettings();

    var flag;

    let mutex = (func) =>
      function () {
        if (!flag) {
          flag = true;
          func.apply(null, arguments);
          flag = false;
        }
      };

    this.connect('row-changed', mutex(this._onRowChanged.bind(this)));

    this.connect('row-inserted', mutex(this._onRowInserted.bind(this)));

    this.connect('row-deleted', mutex(this._onRowDeleted.bind(this)));
  }

  getConfig(iter) {
    let json = this.get_value(iter, this.Columns.CONFIG);

    if (!json) {
      throw new Error('getConfig() failed for iter=' + iter);
    }

    let config = new ConfigModel(JSON.parse(json));

    config.connect('update', () => {
      this.set(
        iter,
        [this.Columns.CONFIG],
        [config.toString()]
      );
    });

    return config;
  }

  _getLabel(config) {
    return config.name;
  }

  _getDefaults() {
    return Globals.DEFAULT_STASH;
  }

  _reloadFromSettings() {
    this.clear();

    let configs = this._settings.get_strv(Globals.STORAGE_KEY_STASHES);

    // Use a default stash if none have been created yet
    if (!configs || configs.length < 1) {
      configs = [JSON.stringify(Globals.DEFAULT_STASH)];
    }

    for (let key in configs) {
      let json = configs[key];
      try {
        let label = this._getLabel(JSON.parse(json));
        this.set(
          this.append(),
          [this.Columns.LABEL, this.Columns.CONFIG],
          [label, json]
        );
      } catch (e) {
        logError('error loading stash config: ' + e);
      }
    }
  }

  _writeSettings() {
    let [res, iter] = this.get_iter_first();
    let configs = [];

    while (res) {
      configs.push(this.get_value(iter, this.Columns.CONFIG));
      res = this.iter_next(iter);
    }

    this._settings.set_strv(Globals.STORAGE_KEY_STASHES, configs);
  }

  _onRowChanged(self, path, iter) {
    let config = this.get_value(iter, this.Columns.CONFIG);

    this.set(
      iter,
      [this.Columns.LABEL, this.Columns.CONFIG],
      [this._getLabel(JSON.parse(config)), config]
    );

    this._writeSettings();
  }

  _onRowInserted(self, path, iter) {
    let defaults = this._getDefaults();

    this.set(
      iter,
      [this.Columns.LABEL, this.Columns.CONFIG],
      [this._getLabel(defaults), JSON.stringify(defaults)]
    );

    this._writeSettings();
  }

  _onRowDeleted(self, path, iter) {
    this._writeSettings();
  }

  destroy() {
    if (this._settingsChangedId && this._settings) {
      this._settings.disconnect(this._settingsChangedId);
    }
  }
});
