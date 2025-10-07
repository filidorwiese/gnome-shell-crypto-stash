const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Signals = imports.signals;

const Local = imports.misc.extensionUtils.getCurrentExtension();
const Globals = Local.imports.Globals;

const makeConfigRow = (description, widget) => {
    let box = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        margin_bottom: 8,
        hexpand: true,
        vexpand: false,
        spacing: 12
    });

    let label = new Gtk.Label({
        label: description,
        xalign: 0,
        hexpand: true
    });

    box.append(label);
    box.append(widget);

    return box;
};

const ComboBoxView = class {
    constructor(options) {
        this.Columns = {LABEL: 0, VALUE: 1};

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
    }

    setOptions(options) {
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
};
Signals.addSignalMethods(ComboBoxView.prototype);

var StashConfigView = class {
    constructor(config, availableCoins) {
        this._config = config;
        this._availableCoins = availableCoins;

        this._renderView();
    }

    _renderView() {
        let padding = 8;
        this.widget = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
        });

        let frame;
        frame = new Gtk.Frame({
            label: 'Stash Settings',
            margin_bottom: 15
        });
        this._layoutStashSettings = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            margin_top: padding,
            margin_bottom: padding,
            margin_start: padding,
            margin_end: padding
        });
        frame.set_child(this._layoutStashSettings);
        this.widget.append(frame);

        frame = new Gtk.Frame({label: 'Assets'});
        this._layoutAssetsSettings = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            margin_top: padding,
            margin_bottom: padding,
            margin_start: padding,
            margin_end: padding
        });
        frame.set_child(this._layoutAssetsSettings);
        this.widget.append(frame);

        this._layoutStashSettings.append(this._confName());
        this._layoutStashSettings.append(this._confVisible());
        this._layoutStashSettings.append(this._confCurrency());
        this._layoutStashSettings.append(this._confInvestment());

        this._layoutAssetsSettings.append(this._confAssetsCollection());
        this._layoutAssetsSettings.append(new Gtk.Separator());
        this._layoutAssetsSettings.append(this._confAssetsCollectionAdd());
    }

    _confName() {
        let preset = this._config.get('name');

        let nameView = new Gtk.Entry({
            'max-length': 20,
            text: preset,
            xalign: 1
        });

        nameView.connect('notify::text', () => {
            this._config.set('name', nameView.get_text());
        });

        return makeConfigRow('Name', nameView);
    }

    _confVisible() {
        let preset = this._config.get('visible') !== false;

        let switchView = new Gtk.Switch({active: preset});

        switchView.connect('notify::active', (obj) => {
            this._config.set('visible', obj.active);
        });

        return makeConfigRow('Visible in top panel', switchView);
    }

    _confCurrency() {
        let preset = this._config.get('currency');

        let options = Globals.AVAILABLE_CURRENCIES.map(
            (v, i) => ({label: v, value: v, active: (v === preset)})
        );
        const currencyView = new ComboBoxView(options);
        currencyView.connect('changed', () => {
            let [success, iter] = currencyView.widget.get_active_iter();
            if (!success) return;
            let symbol = currencyView.model.get_value(iter, 0);
            this._config.set('currency', symbol);
        });

        return makeConfigRow('Native currency', currencyView.widget);
    }

    _confInvestment() {
        let preset = this._config.get('investment') || '0';

        let investmentView = new Gtk.Entry({
            'max-length': 20,
            text: String(parseInt(preset)),
            xalign: 1
        });

        investmentView.connect('notify::text', () => {
            const value = parseInt(investmentView.get_text()) || 0;
            this._config.set('investment', value);
            if (investmentView.get_text() !== String(value) && String(value) > 0) {
                investmentView.set_text(String(value));
            }
        });

        return makeConfigRow('Deduct investment', investmentView);
    }

    _confAssetsCollection() {
        let box = new Gtk.Box({
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 10,
            margin_end: 10,
            orientation: Gtk.Orientation.VERTICAL,
        });
        box.append(this._getAssetsTreeView());
        box.append(this._getAssetsToolbar());

        return box;
    }

    _confAssetsCollectionAdd() {
        let sidebar = new Gtk.Box({
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 10,
            margin_end: 10,
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6
        });

        let options = this._availableCoins.map(
            (v, i) => ({label: v, value: v, active: (i === 0)})
        );
        this.addAssetSymbolView = new ComboBoxView(options);

        this.addAssetSymbol = this.addAssetSymbolView.widget;
        this.addAssetAmount = new Gtk.Entry({
            'max-length': 16,
            text: '1',
            hexpand: true,
        });
        if (this.addAssetAmount.set_input_purpose) {
          this.addAssetAmount.set_input_purpose(Gtk.InputPurpose.DIGITS);
        }

        this.changeAssetButton = new Gtk.Button({
            label: 'Update asset',
            hexpand: true,
            sensitive: false
        });
        this.changeAssetButton.connect('clicked', this._updateClicked.bind(this));
        this.addAssetButton = new Gtk.Button({
            label: 'Add as new',
            hexpand: true,
        });
        this.addAssetButton.connect('clicked', this._addClicked.bind(this));

        sidebar.append(this.addAssetAmount);
        sidebar.append(this.addAssetSymbol);
        sidebar.append(this.changeAssetButton);
        sidebar.append(this.addAssetButton);

        return sidebar;
    }

    _getAssetsTreeView() {
        let preset = this._config.get('assets');
        this._listAssetsStore = new Gtk.ListStore();
        this._listAssetsStore.set_column_types([
            GObject.TYPE_STRING,
            GObject.TYPE_STRING
        ]);

        for (let i = 0; i < preset.length; i++) {
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

        let symbol = new Gtk.TreeViewColumn({title: 'Asset'});
        let amount = new Gtk.TreeViewColumn({title: 'Amount'});
        let normal = new Gtk.CellRendererText();
        symbol.pack_start(normal, true);
        amount.pack_start(normal, true);
        symbol.add_attribute(normal, 'text', 0);
        amount.add_attribute(normal, 'text', 1);

        this._treeView.insert_column(symbol, 0);
        this._treeView.insert_column(amount, 1);

        this._assetsCollection = this._treeView.get_selection();
        this._assetsCollection.connect('changed', this._updateAssetsToolbar.bind(this));

        return this._treeView;
    }

    _getAssetsToolbar() {
        let toolbar = this._toolbar = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 0,
            visible: false
        });

        toolbar.add_css_class('toolbar');

        let delButton = this._delButton = new Gtk.Button({
            label: 'Remove asset',
            sensitive: false,
            has_frame: false
        });
        delButton.connect('clicked', this._delClicked.bind(this));
        toolbar.append(delButton);

        this._updateAssetsToolbar();

        return toolbar;
    }

    _updateAssetsToolbar() {
        let sensitive = false;

        if (this._assetsCollection) {
            let [isSelected, , iter] = this._assetsCollection.get_selected();
            sensitive = !!isSelected;

            if (isSelected) {
                const symbol = this._listAssetsStore.get_value(iter, 0);
                const amount = this._listAssetsStore.get_value(iter, 1);

                this.addAssetAmount.set_text(amount.replace(',', '.'));
                let [res, iter2] = this.addAssetSymbol.model.get_iter_first();
                while (res) {
                    if (this.addAssetSymbol.model.get_value(iter2, 0) === symbol) {
                        this.addAssetSymbol.set_active_iter(iter2);
                    }
                    res = this.addAssetSymbol.model.iter_next(iter2);
                }
            }

            if (this.changeAssetButton) {
                this.changeAssetButton.set_sensitive(isSelected);
            }

            if (this._delButton) {
                this._delButton.set_sensitive(sensitive);
            }
        }

        if (this._toolbar) {
            this._toolbar.set_visible(sensitive);
        }
    }

    _addClicked() {
        let [success, iter] = this.addAssetSymbol.get_active_iter();
        if (!success) return;
        let symbol = this.addAssetSymbol.model.get_value(iter, 0);
        let amount = Number(this.addAssetAmount.get_text());

        if (!isNaN(amount) && amount > 0) {
            this._listAssetsStore.set(this._listAssetsStore.append(), [0, 1],
                [symbol, amount]);
            this._saveAssetsCollection();
            this.addAssetAmount.set_text('1');
            this.addAssetSymbol.set_active(0);
            this._assetsCollection.unselect_all();
        }

        this._updateAssetsToolbar();
    }

    _updateClicked() {
        let [success, iter] = this.addAssetSymbol.get_active_iter();
        if (!success) { return; }
        let symbol = this.addAssetSymbol.model.get_value(iter, 0);
        let amount = Number(this.addAssetAmount.get_text());

        if (!isNaN(amount) && amount > 0) {
            let [isSelected, , iter] = this._assetsCollection.get_selected();
            if (!isSelected) { return; }

            this._listAssetsStore.set_value(iter, 0, symbol);
            this._listAssetsStore.set_value(iter, 1, amount);
            this._saveAssetsCollection();
        }

        this._updateAssetsToolbar();
    }

    _delClicked() {
        let [isSelected, , iter] = this._assetsCollection.get_selected();

        if (isSelected) {
            this._listAssetsStore.remove(iter);
            this._saveAssetsCollection();
            this.addAssetAmount.set_text('1');
            this.addAssetSymbol.set_active(0);
            this._assetsCollection.unselect_all();
        }

        this._updateAssetsToolbar();
    }

    _saveAssetsCollection() {
        let [res, iter] = this._listAssetsStore.get_iter_first();
        let newAssets = [];

        while (res) {
            const symbol = this._listAssetsStore.get_value(iter, 0);
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
    }

    destroy() {
        this.disconnectAll();
    }
};

Signals.addSignalMethods(StashConfigView.prototype);
