const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Signals = imports.signals;
const Lang = imports.lang;

const Local = imports.misc.extensionUtils.getCurrentExtension();
const Globals = Local.imports.Globals;

const makeConfigRow = (description, widget) => {
  let box = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    margin_bottom: 8,
    hexpand: true,
    vexpand: false
  });

  let label = new Gtk.Label({
    label: description,
    xalign: 0,
    expand: true
  });

  box.add(label);
  box.add(widget);

  return box;
};

const ComboBoxView = new Lang.Class({
  Name: "ComboBoxView",

  Columns: { LABEL: 0, VALUE: 1 },

  _init: function (options) {
    let model = new Gtk.ListStore();
    model.set_column_types([GObject.TYPE_STRING]);

    let comboBox = new Gtk.ComboBox({model: model});
    let renderer = new Gtk.CellRendererText();

    comboBox.pack_start(renderer, true);
    comboBox.add_attribute(renderer, 'text', 0);

    this.widget = comboBox;
    this.model = model;
    this.setOptions(options);

    comboBox.connect('changed', (_) => {
      let i = comboBox.get_active();
      if (i in this._options) {
        this.emit('changed', this._options[i].value);
      }
    });
  },

  setOptions: function (options) {
    this.model.clear();
    this._options = options || [];

    this._options.forEach((o) => {
      let iter;

      this.model.set(
        iter = this.model.append(), [this.Columns.LABEL], [o.label]
      );

      if (o.active) {
        this.widget.set_active_iter(iter);
      }
    });
  }
});
Signals.addSignalMethods(ComboBoxView.prototype);


var StashConfigView = new Lang.Class({
  Name: "CryptoStash.StashConfigView",

  _init: function (config, availableCoins) {

    this._config = config;
    this._availableCoins = availableCoins;

    this._renderView();
  },

  _renderView: function() {
    let padding = 8;
    this.widget = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
    });

    let frame;
    frame = new Gtk.Frame({ label: "Stash Settings", margin_bottom: 15 });
    this._layoutStashSettings = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      border_width: padding
    });
    frame.add(this._layoutStashSettings);
    this.widget.add(frame);

    frame = new Gtk.Frame({ label: "Crypto stash" });
    this._layoutAssetsSettings = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      border_width: padding
    });
    frame.add(this._layoutAssetsSettings);
    this.widget.add(frame);

    this._layoutStashSettings.add(this._confName());
    this._layoutStashSettings.add(this._confVisible());
    this._layoutStashSettings.add(this._confCurrency());

    this._layoutAssetsSettings.add(this._confAssetsCollection());
    this._layoutAssetsSettings.add(new Gtk.Separator());
    this._layoutAssetsSettings.add(this._confAssetsCollectionAdd());

    this.widget.show_all();
  },

  _confName: function () {
    let preset = this._config.get('name');

    let nameView = new Gtk.Entry({
      'max-length': 20,
      text: preset
    });

    nameView.connect('notify::text', () => {
      this._config.set('name', nameView.get_text());
    });

    return makeConfigRow("Name", nameView);
  },

  _confVisible: function () {
    let preset = this._config.get('visible') !== false;

    let switchView = new Gtk.Switch({active: preset});

    switchView.connect('notify::active', (obj) => {
      this._config.set('visible', obj.active);
    });

    return makeConfigRow("Visible", switchView);
  },

  _confCurrency: function () {
    let preset = this._config.get('currency');

    let options = Globals.AVAILABLE_CURRENCIES.map(
      (v, i) => ({label: v, value: v, active: (v === preset)})
    );
    const currencyView = new ComboBoxView(options);

    currencyView.connect('changed', (obj) => {
      let [success, iter] = currencyView.widget.get_active_iter();
      if (!success) return;
      let symbol = currencyView.model.get_value(iter, 0);
      this._config.set('currency', symbol);
    });

    return makeConfigRow("Currency", currencyView.widget);
  },

  _confAssetsCollection: function() {
    let box = new Gtk.Box({
      margin: 10,
      orientation: Gtk.Orientation.VERTICAL,
    });
    box.add(this._getAssetsTreeView());
    box.add(this._getAssetsToolbar());

    return box;
  },

  _confAssetsCollectionAdd: function() {
    let sidebar = new Gtk.Box({
      margin: 10,
      orientation: Gtk.Orientation.HORIZONTAL,
    });

    let options = this._availableCoins.map(
      (v, i) => ({label: v, value: v, active: (i === 0)})
    );
    this.addAssetSymbolView = new ComboBoxView(options);

    this.addAssetSymbol = this.addAssetSymbolView.widget;
    this.addAssetAmount = new Gtk.Entry({
      'max-length': 9,
      text: '1'
    });
    this.addAssetButton = new Gtk.Button({
      label: 'Add asset',
      margin_left: 15
    });
    this.addAssetButton.connect('clicked', this._addClicked.bind(this));
    this.addAssetError = new Gtk.Label({
      label: '',
      margin_left: 15,
      useMarkup: true,
    });

    sidebar.add(this.addAssetAmount);
    sidebar.add(this.addAssetSymbol);
    sidebar.add(this.addAssetButton);
    sidebar.add(this.addAssetError);

    return sidebar;
  },

  _getAssetsTreeView: function () {
    let preset = this._config.get('assets');
    this._listAssetsStore = new Gtk.ListStore();
    this._listAssetsStore.set_column_types ([
      GObject.TYPE_STRING,
      GObject.TYPE_STRING
    ]);

    for (let i = 0; i < preset.length; i++ ) {
      let asset = preset[i];
      this._listAssetsStore.set(this._listAssetsStore.append(), [0, 1],
        [asset.symbol, asset.amount]);
    }

    this._treeView = new Gtk.TreeView({
      model: this._listAssetsStore,
      headers_visible: true,
      reorderable: false,
      hexpand: true,
      vexpand: true
    });

    let symbol = new Gtk.TreeViewColumn ({ title: "Asset" });
    let amount = new Gtk.TreeViewColumn ({ title: "Amount" });
    let normal = new Gtk.CellRendererText ();
    symbol.pack_start (normal, true);
    amount.pack_start (normal, true);
    symbol.add_attribute (normal, "text", 0);
    amount.add_attribute (normal, "text", 1);

    this._treeView.insert_column (symbol, 0);
    this._treeView.insert_column (amount, 1);

    this._assetsCollection = this._treeView.get_selection();
    this._assetsCollection.connect('changed', this._updateAssetsToolbar.bind(this));

    return this._treeView;
  },

  _getAssetsToolbar: function () {
    let toolbar = this._toolbar = new Gtk.Toolbar({
      icon_size: 1,
      visible: false
    });

    toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR);

    let delButton = this._delButton = new Gtk.ToolButton({label: 'Remove asset' });
    delButton.connect('clicked', this._delClicked.bind(this));
    toolbar.add(delButton);

    this._updateAssetsToolbar();

    return toolbar;
  },

  _updateAssetsToolbar: function () {
    let sensitive = false;

    if (this._assetsCollection) {
      let [isSelected] = this._assetsCollection.get_selected();
      sensitive = !!isSelected;
    }

    this._delButton.set_sensitive(sensitive);
    if (this._toolbar) {
      this._toolbar.set_visible(sensitive);
    }
  },

  _addClicked: function () {
    let [success, iter] = this.addAssetSymbol.get_active_iter();
    if (!success) return;
    let symbol = this.addAssetSymbol.model.get_value(iter, 0);
    let amount = Number(this.addAssetAmount.get_text());

    if (isNaN(amount) || amount <= 0) {
      this.addAssetError.label = '<span color="Red">Amount is not a number</span>';
    } else {
      this._listAssetsStore.set(this._listAssetsStore.append(), [0, 1],
        [symbol, amount]);
      this._saveAssetsCollection();
      this.addAssetAmount.set_text('1');
      this.addAssetSymbol.set_active(0);
      this.addAssetError.label = '';
    }

    this._updateAssetsToolbar();
  },

  _delClicked: function () {
    let [isSelected, , iter] = this._assetsCollection.get_selected();

    if (isSelected) {
      this._listAssetsStore.remove(iter);
      this._saveAssetsCollection();
    }

    this._updateAssetsToolbar();
  },

  _saveAssetsCollection: function() {
    let [res, iter] = this._listAssetsStore.get_iter_first();
    let newAssets = [];

    while (res) {
      const symbol = this._listAssetsStore.get_value(iter, 0) ;
      const amount = this._listAssetsStore.get_value(iter, 1);

      if (symbol && amount) {
        newAssets.push({
          symbol,
          amount
        });
      }

      res = this._listAssetsStore.iter_next(iter);
    }

    this._config.set('assets', newAssets);
  },

  destroy: function () {
    this.disconnectAll();
    this.widget.destroy();
  }
});

Signals.addSignalMethods(StashConfigView.prototype);
