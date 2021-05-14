const GObject = imports.gi.GObject
const Gtk = imports.gi.Gtk

const ExtensionUtils = imports.misc.extensionUtils
const Local = ExtensionUtils.getCurrentExtension()
const HTTP = Local.imports.HTTP
const Globals = Local.imports.Globals

const StashModel =
  Local.imports.StashModel.StashModel
const StashConfigView =
  Local.imports.StashConfigView.StashConfigView

function init () {}

function buildPrefsWidget () {
  let widget = new MyPrefsWidget()
  widget.show_all()
  return widget
}

const MyPrefsWidget = GObject.registerClass(
  class MyPrefsWidget extends Gtk.Box {

    _init () {
      super._init({
        orientation: Gtk.Orientation.HORIZONTAL,
        margin: 10,
        width_request: 600
      })

      this.loadCoinCapCoins()
    }

    loadCoinCapCoins () {
      this._loadingText = new Gtk.Label({
        visible: true,
        justify: 1,
        label: `Loading assets from coincap.io`,
        expand: true,
        xalign: 0.5
      })
      this.add(this._loadingText)

      // Load available assets from coincap.io
      this.availableCoins = ['BTC']
      HTTP.getJSON(Globals.GET_CRYPTO_ASSETS_URL, (_, data) => {
        if (data.hasOwnProperty('data') && data.data.length > 0) {
          this.availableCoins = data.data.map((c) => c.symbol).sort((a, b) => {
            if (a > b) return 1
            if (a < b) return -1
            return 0
          })
        }

        this.remove(this._loadingText)
        this.render()
      })
    }

    render () {
      this._store = new StashModel()

      /* sidebar (left) */
      let sidebar = new Gtk.Box({
        margin: 10,
        orientation: Gtk.Orientation.VERTICAL,
        width_request: 200
      })
      sidebar.add(this._getTreeView())
      sidebar.add(this._getToolbar())
      this.add(sidebar)

      /* config (right) */
      this._configLayout = new Gtk.Box({
        margin: 10,
        orientation: Gtk.Orientation.HORIZONTAL,
        expand: true,
        width_request: 200
      })
      this.add(this._configLayout)

      this._introText = new Gtk.Label({
        margin: 50,
        visible: true,
        justify: 2,
        label: `<span size="xx-large">${Globals.SYMBOLS.wallet}</span>\n\n${Local.metadata['title']} v${Local.metadata['version'].toFixed(2)}\n\nAuthor: <a href="${Local.metadata['author_url']}">Filidor Wiese</a>\n\nRepository: <a href="${Local.metadata['url']}">${Local.metadata['url']}</a>`,
        useMarkup: true,
        xalign: 0,
        expand: true
      })
      this._configLayout.add(this._introText)

      /* behavior */
      this._selection = this._treeView.get_selection()
      this._selection.connect('changed', this._onSelectionChanged.bind(this))

      this.show_all()
    }

    _getTreeView () {
      this._treeView = new Gtk.TreeView({
        model: this._store,
        headers_visible: false,
        reorderable: true,
        hexpand: false,
        vexpand: true
      })

      let label = new Gtk.TreeViewColumn({title: 'Stashes'})
      let renderer = new Gtk.CellRendererText()
      label.pack_start(renderer, true)
      label.add_attribute(renderer, 'text', 0)
      this._treeView.insert_column(label, 0)

      return this._treeView
    }

    _onSelectionChanged () {
      let [isSelected, , iter] = this._selection.get_selected()

      if (isSelected) {
        this._showStashConfig(this._store.getConfig(iter))
        this._introText.visible = false
      } else {
        this._showStashConfig(null)
        this._introText.visible = true
      }

      this._updateToolbar()
    }

    _showStashConfig (config) {
      if (this._stashConfigView) {
        this._configLayout.remove(this._stashConfigView.widget)
        this._stashConfigView.destroy()
        this._stashConfigView = null
      }

      if (config === null) {
        return
      }

      this._stashConfigView = new StashConfigView(config, this.availableCoins)
      this._configLayout.add(this._stashConfigView.widget)
    }

    _getToolbar () {
      let toolbar = this._toolbar = new Gtk.Toolbar({
        icon_size: 1
      })

      toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR)

      let newButton = new Gtk.ToolButton({icon_name: 'list-add-symbolic'})
      newButton.connect('clicked', this._addClicked.bind(this))
      toolbar.add(newButton)

      let delButton = this._delButton = new Gtk.ToolButton({icon_name: 'list-remove-symbolic'})
      delButton.connect('clicked', this._delClicked.bind(this))
      toolbar.add(delButton)

      this._updateToolbar()

      return toolbar
    }

    _updateToolbar () {
      let sensitive = false

      if (this._selection) {
        let [isSelected] = this._selection.get_selected()
        sensitive = isSelected
      }

      this._delButton.set_sensitive(sensitive)
    }

    _addClicked () {
      this._store.append()
      this._updateToolbar()
    }

    _delClicked () {
      let [isSelected, , iter] = this._selection.get_selected()

      if (isSelected) {
        this._store.remove(iter)
      }

      this._updateToolbar()
    }

  }
)
