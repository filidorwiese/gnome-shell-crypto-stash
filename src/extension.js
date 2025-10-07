const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const CryptoRatesApi = Me.imports.CryptoRatesApi;
const IndicatorModel = Me.imports.IndicatorModel;
const Globals = Me.imports.Globals;

let _indicatorCollection = null;
let _api = null;

function enable() {
    try {
        _api = new CryptoRatesApi.CryptoRatesApi();
        _indicatorCollection = new IndicatorCollection();
    } catch (e) {
        console.error('Extension enable error:', e);
    }
}

function disable() {
    if (_indicatorCollection) {
        _indicatorCollection.destroy();
        _indicatorCollection = null;
    }
    if (_api) {
        _api.destroy();
        _api = null;
    }
}

function getSettings(schema = null) {
    schema = schema || Me.metadata['settings-schema'];

    const GioSSS = Gio.SettingsSchemaSource;

    let schemaDir = Gio.File.new_for_path(GLib.build_filenamev([Me.path, 'schemas']));
    let schemaSource;

    if (schemaDir.query_exists(null)) {
        schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),
            GioSSS.get_default(),
            false);
    } else {
        schemaSource = GioSSS.get_default();
    }

    let schemaObj = schemaSource.lookup(schema, true);
    if (!schemaObj) {
        throw new Error(`Schema ${schema} could not be found for extension ${Me.metadata.uuid}`);
    }

    return new Gio.Settings({settings_schema: schemaObj});
}

const StashIndicatorView = GObject.registerClass(
class StashIndicatorView extends PanelMenu.Button {
    _init(stash) {
        super._init(0);
        this._stash = stash;
        this._api = _api;

        this._initLayout();
        this._initBehavior();
    }

    _initLayout() {
        let layout = new St.BoxLayout();

        this._indicatorView = new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'indicator'
        });

        this._statusView = new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'status'
        });

        layout.add_child(this._statusView);
        layout.add_child(this._indicatorView);
        this.add_child(layout);

        this._popupItemTitle = new PopupMenu.PopupMenuItem(
            '', {activate: false, hover: false, can_focus: false}
        );
        this._popupItemTitle.label.set_style('max-width: 400px;');
        this._popupItemTitle.label.clutter_text.set_line_wrap(true);
        this._popupItemTitle.label.clutter_text.set_use_markup(true);
        this.menu.addMenuItem(this._popupItemTitle);

        this._popupItemBreakdown = new PopupMenu.PopupMenuItem(
            '', {activate: false, hover: false, can_focus: false}
        );
        this._popupItemBreakdown.label.set_style('max-width: 400px; font-size:12px;');
        this._popupItemBreakdown.label.clutter_text.set_line_wrap(true);
        this._popupItemBreakdown.label.clutter_text.set_use_markup(true);
        this.menu.addMenuItem(this._popupItemBreakdown);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._popupItemSettings = new PopupMenu.PopupMenuItem('⚙ Settings...');
        this.menu.addMenuItem(this._popupItemSettings);
        this._popupItemSettings.connect('activate', () => {
            ExtensionUtils.openPrefs();
        });
    }

    _initBehavior() {
        this._model = new IndicatorModel.IndicatorModel(this._api, this._stash);

        this._model.connect('update-start', () => {
            this._displayStatus(Globals.SYMBOLS.refresh);
        });

        this._model.connect('update', (obj, err, stash) => {
            if (err) {
                this._showError(err);
            } else {
                this._showData(stash);
            }
        });

        this._displayStatus(Globals.SYMBOLS.refresh);
    }

    _showError() {
        this._displayStatus(Globals.SYMBOLS.error);
    }

    _showData(stash) {
        const formatCurrency = (value, precision) => {
            const minimumFractionDigits = typeof precision !== 'undefined' ? precision : Math.abs(value) < 100 ? 2 : 0;
            return new Intl.NumberFormat('en-US', {minimumFractionDigits, maximumFractionDigits: minimumFractionDigits}).format(value);
        };

        if (stash['visible']) {
          this._displayText(stash.currency + ' ' + formatCurrency(stash.totalValue));
        } else {
          this._displayText(stash.name);
        }
        this._displayStatus(Globals.SYMBOLS.wallet);
        this._popupItemTitle.label.clutter_text.set_markup(`${Globals.SYMBOLS.wallet} <b>${stash.name}</b>`);

        const breakdown = stash.stash.map((c) => {
            const left = `${formatCurrency(c.amount, 3)} ${c.asset} × ${stash.currency} ${formatCurrency(c.value)}`;
            const right = `${stash.currency} ${formatCurrency(c.totalValue)}`;
            return `<span font_family="monospace">${left}\t= ${right}</span>`;
        });

        if (stash.investment > 0) {
            breakdown.push(`<span font_family="monospace">Investment\t\t= ${stash.currency} ${formatCurrency(stash.investment * -1)}</span>`);
        }
        breakdown.push(`<span font_family="monospace">Current value\t\t= ${stash.currency} ${formatCurrency(stash.totalValue)}</span>`);

        this._popupItemBreakdown.label.clutter_text.set_markup(breakdown.join('\n'));
    }

    _displayStatus(text) {
        this._statusView.text = text;
    }

    _displayText(text) {
        this._indicatorView.text = text;
    }

    destroy() {
        if (this._model) {
            this._model.destroy();
        }
        if (this._indicatorView) {
            this._indicatorView.destroy();
        }
        if (this._statusView) {
            this._statusView.destroy();
        }

        super.destroy();
    }
});

class IndicatorCollection {
    constructor() {
        this._indicators = [];

        this._settings = getSettings();

        this._settingsChangedId = this._settings.connect(
            'changed::' + Globals.STORAGE_KEY_STASHES,
            this._createIndicators.bind(this)
        );

        this._createIndicators();
    }

    _createIndicators() {
        this.removeAll();

        let stashes = this._settings.get_strv(Globals.STORAGE_KEY_STASHES);

        if (!stashes || stashes.length < 1) {
            stashes = [JSON.stringify(Globals.DEFAULT_STASH)];
        }

        let indicators = stashes
            .map(JSON.parse);

        if (indicators.length) {
            if (!_api.isPolling()) {
                _api.startPolling();
            }
            indicators.forEach((s) => {
                try {
                    this.add(new StashIndicatorView(s));
                } catch (e) {
                    console.error('error creating indicator: ' + e);
                }
            });
        } else {
            _api.stopPolling();
        }
    }

    removeAll() {
        this._indicators.forEach((i) => i.destroy());
        this._indicators = [];
    }

    add(indicator) {
        this._indicators.push(indicator);
        let name = 'crypto-stash-indicator-' + this._indicators.length;
        Main.panel.addToStatusArea(name, indicator);
    }

    destroy() {
        this.removeAll();
        if (this._settingsChangedId && this._settings) {
            this._settings.disconnect(this._settingsChangedId);
        }
    }
}
