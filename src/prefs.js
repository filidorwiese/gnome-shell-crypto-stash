const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;
const Local = ExtensionUtils.getCurrentExtension();
const HTTP = Local.imports.HTTP;
const Convenience = Local.imports.convenience;

const TickerCollectionModel =
  Local.imports.TickerCollectionModel.TickerCollectionModel;
const TickerConfigView =
  Local.imports.TickerConfigView.TickerConfigView;

function init() {}

function buildPrefsWidget () {
  let widget = new MyPrefsWidget();
  widget.show_all();
  return widget;
}

const MyPrefsWidget = GObject.registerClass(
  class MyPrefsWidget extends Gtk.Box {

    _init () {
      super._init({
        orientation: Gtk.Orientation.HORIZONTAL,
        margin: 10,
        width_request: 400
      });

      this._store = new TickerCollectionModel();

      /* sidebar (left) */
      let sidebar = new Gtk.Box({
        margin: 10,
        orientation: Gtk.Orientation.VERTICAL,
        width_request: 200
      });
      sidebar.add(this._getTreeView());
      sidebar.add(this._getToolbar());
      this.add(sidebar);

      /* config (right) */
      this._configLayout = new Gtk.Box({
        margin: 10,
        orientation: Gtk.Orientation.HORIZONTAL,
        expand: true,
        width_request: 200
      });
      this.add(this._configLayout);

      this._introText = new Gtk.Label({
        margin: 50,
        visible: true,
        justify: 2,
        label: `<span size="xx-large">🐋</span>\n\n${Local.metadata['name']} v${Local.metadata['version'].toFixed(2)}\n\nAuthor: <a href="${Local.metadata['author_url']}">Filidor Wiese</a>\n\nRepository: <a href="${Local.metadata['url']}">${Local.metadata['url']}</a>`,
        useMarkup: true,
        xalign: 0,
        expand: true
      });
      this._configLayout.add(this._introText);

      /* behavior */
      this._selection = this._treeView.get_selection();
      this._selection.connect('changed', this._onSelectionChanged.bind(this));
    }

    _getTreeView () {
      this._treeView = new Gtk.TreeView({
        model: this._store,
        headers_visible: false,
        reorderable: true,
        hexpand: false,
        vexpand: true
      });

      let label = new Gtk.TreeViewColumn({title: "Tickers"});
      let renderer = new Gtk.CellRendererText();
      label.pack_start(renderer, true);
      label.add_attribute(renderer, "text", 0);
      this._treeView.insert_column(label, 0);

      return this._treeView;
    }

    _onSelectionChanged () {
      let [isSelected, , iter] = this._selection.get_selected();

      if (isSelected) {
        this._showTickerConfig(this._store.getConfig(iter));
        this._introText.visible = false;
      } else {
        this._showTickerConfig(null);
        this._introText.visible = true;
      }

      this._updateToolbar();
    }

    _showTickerConfig (tickerConfig) {
      if (this._tickerConfigView) {
        this._configLayout.remove(this._tickerConfigView.widget);
        this._tickerConfigView.destroy();
        this._tickerConfigView = null;
      }

      if (tickerConfig === null) {
        return;
      }

      this._tickerConfigView = new TickerConfigView(tickerConfig);
      this._configLayout.add(this._tickerConfigView.widget);
    }

    _getToolbar () {
      let toolbar = this._toolbar = new Gtk.Toolbar({
        icon_size: 1
      });

      toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR);

      /* new widget button with menu */
      let newButton = new Gtk.ToolButton({icon_name: "list-add-symbolic"});
      newButton.connect('clicked', this._addClicked.bind(this));
      toolbar.add(newButton);

      /* delete button */
      let delButton = this._delButton =
        new Gtk.ToolButton({icon_name: "list-remove-symbolic"});
      delButton.connect('clicked', this._delClicked.bind(this));
      toolbar.add(delButton);

      this._updateToolbar();

      return toolbar;
    }

    _updateToolbar () {
      let sensitive = false;

      if (this._selection) {
        let [isSelected] = this._selection.get_selected();
        sensitive = isSelected;
      }

      this._delButton.set_sensitive(sensitive);
    }

    _addClicked () {
      this._store.append();
      this._updateToolbar();
    }

    _delClicked () {
      let [isSelected, , iter] = this._selection.get_selected();

      if (isSelected) {
        this._store.remove(iter);
      }

      this._updateToolbar();
    }

  }
);

