import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';
import Adw from 'gi://Adw';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import * as HTTP from './HTTP.js';
import * as Globals from './Globals.js';
import {StashModel} from './StashModel.js';
import {StashConfigView} from './StashConfigView.js';

const MyPrefsWidget = GObject.registerClass(
class MyPrefsWidget extends Gtk.Box {
    _init(settings, metadata) {
        super._init({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
            hexpand: true,
            vexpand: true
        });

        this._settings = settings;
        this._metadata = metadata;

        this.loadCryptoRates();
    }

    loadCryptoRates() {
        this._loadingText = new Gtk.Label({
            visible: true,
            justify: Gtk.Justification.CENTER,
            label: 'Loading crypto rates',
            hexpand: true,
            vexpand: true
        });
        this.append(this._loadingText);

        this.availableCoins = ['BTC'];

        HTTP.getJSON(Globals.GET_CRYPTO_RATES_URL, (error, data) => {
            log('HTTP.getJSON callback fired');
            if (error) {
                log(`Error fetching crypto rates: ${error}`);
            } else if (data?.data?.length > 0) {
                log(`Received ${data.data.length} crypto rates`);
                this.availableCoins = data.data.map((c) => c.symbol).sort();
            }

            try {
                this.remove(this._loadingText);
                log('About to call render()');
                this.render();
                log('render() completed');
            } catch (e) {
                log(`Error in render: ${e}`);
                logError(e);
            }
        });
    }

    render() {
        this._store = new StashModel(this._settings);

        const sidebar = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            width_request: 200
        });
        sidebar.append(this._getTreeView());
        sidebar.append(this._getToolbar());
        this.append(sidebar);

        this._configLayout = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            hexpand: true,
            width_request: 500
        });
        this.append(this._configLayout);

        this._introText = new Gtk.Label({
            visible: true,
            justify: Gtk.Justification.LEFT,
            label: `${Globals.SYMBOLS.wallet} ${this._metadata['name']} v${this._metadata['tag'].toFixed(2)}\n\nAuthor: ${this._metadata['author']} - <a href="${this._metadata['author_url']}">${this._metadata['author_url']}</a>\n\nRepository: <a href="${this._metadata['url']}">${this._metadata['url']}</a>`,
            use_markup: true,
            xalign: 0,
            hexpand: true,
            vexpand: true
        });
        this._configLayout.append(this._introText);

        this._selection = this._treeView.get_selection();
        this._selection.connect('changed', this._onSelectionChanged.bind(this));
    }

    _getTreeView() {
        this._treeView = new Gtk.TreeView({
            model: this._store,
            headers_visible: false,
            reorderable: true,
            hexpand: false,
            vexpand: true
        });

        let label = new Gtk.TreeViewColumn({title: 'Stashes'});
        let renderer = new Gtk.CellRendererText();
        label.pack_start(renderer, true);
        label.add_attribute(renderer, 'text', 0);
        this._treeView.insert_column(label, 0);

        return this._treeView;
    }

    _onSelectionChanged() {
        let [isSelected, , iter] = this._selection.get_selected();

        if (isSelected) {
            this._showStashConfig(this._store.getConfig(iter));
            this._introText.visible = false;
        } else {
            this._showStashConfig(null);
            this._introText.visible = true;
        }

        this._updateToolbar();
    }

    _showStashConfig(config) {
        if (this._stashConfigView) {
            this._configLayout.remove(this._stashConfigView.widget);
            this._stashConfigView.destroy();
            this._stashConfigView = null;
        }

        if (config === null) {
            return;
        }

        this._stashConfigView = new StashConfigView(config, this.availableCoins);
        this._configLayout.append(this._stashConfigView.widget);
    }

    _getToolbar() {
        let toolbar = this._toolbar = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 0
        });

        toolbar.add_css_class('toolbar');

        let newButton = new Gtk.Button({
            icon_name: 'list-add-symbolic',
            has_frame: false
        });
        newButton.connect('clicked', this._addClicked.bind(this));
        toolbar.append(newButton);

        let delButton = this._delButton = new Gtk.Button({
            icon_name: 'list-remove-symbolic',
            has_frame: false
        });
        delButton.connect('clicked', this._delClicked.bind(this));
        toolbar.append(delButton);

        this._updateToolbar();

        return toolbar;
    }

    _updateToolbar() {
        let sensitive = false;

        if (this._selection) {
            let [isSelected] = this._selection.get_selected();
            sensitive = isSelected;
        }

        this._delButton.set_sensitive(sensitive);
    }

    _addClicked() {
        this._store.append();
        this._updateToolbar();
    }

    _delClicked() {
        let [isSelected, , iter] = this._selection.get_selected();

        if (isSelected) {
            this._store.remove(iter);
        }

        this._updateToolbar();
    }
});

export default class CryptoStashPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        HTTP.init(this.metadata);

        const widget = new MyPrefsWidget(this.getSettings(), this.metadata);
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup();
        group.add(widget);
        page.add(group);
        window.add(page);
    }
}
