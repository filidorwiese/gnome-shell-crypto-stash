# CryptoStash - Development Guide

This guide contains information for developers who want to contribute to CryptoStash or develop GNOME Shell extensions.

## 📋 Prerequisites

### Required Tools

- **git**: Version control
- **make**: Build automation
- **zip**: Archive creation for packaging
- **jq**: JSON processor for metadata manipulation
- **gnome-extensions**: GNOME Shell extension management CLI
- **dconf-editor**: GNOME configuration database editor (for debugging settings)

### Install Dependencies

**Ubuntu/Debian:**
```bash
sudo apt install git make zip jq gnome-shell-extension-tool dconf-editor
```

**Fedora:**
```bash
sudo dnf install git make zip jq gnome-extensions-app dconf-editor
```

**Arch:**
```bash
sudo pacman -S git make zip jq dconf-editor
```

## 🚀 Development Workflow

### 1. Clone the Repository

```bash
git clone https://github.com/filidorwiese/gnome-shell-crypto-stash.git
cd gnome-shell-crypto-stash
```

### 2. Development Installation

For development, use symlink mode to avoid reinstalling after every change:

```bash
make link
```

This creates a symbolic link from `src/` to the GNOME extensions directory.

### 3. Enable the Extension

```bash
gnome-extensions enable cryptostash@filidorwiese.nl
```

Restart GNOME Shell:
- Press `Alt+F2`
- Type `r` and press Enter
- Or log out and log back in (required on Wayland)

### 4. Monitor Logs

Watch extension logs in real-time during development:

```bash
make logs
# Or directly:
journalctl /usr/bin/gnome-shell -f
```

Filter for CryptoStash-specific logs:
```bash
journalctl /usr/bin/gnome-shell -f | grep -i crypto
```

### 5. Test Your Changes

After making code changes:

1. **Reload the extension**:
   ```bash
   gnome-extensions disable cryptostash@filidorwiese.nl
   gnome-extensions enable cryptostash@filidorwiese.nl
   ```

2. **Restart GNOME Shell** (if UI doesn't update):
   - X11: `Alt+F2`, type `r`, press Enter
   - Wayland: Log out and log back in

### 6. Test Preferences

Open the preferences window:

```bash
make prefs
# Or directly:
gnome-extensions prefs cryptostash@filidorwiese.nl
```

### 7. Inspect Settings Data

View stored settings using dconf-editor:

```bash
make view-data
# Or directly:
dconf-editor /org/gnome/shell/extensions/crypto-stash/
```

## 🏗️ Makefile Commands

| Command | Description |
|---------|-------------|
| `make package` | Create a release package (`.zip` file) |
| `make install` | Build and install extension to user directory |
| `make uninstall` | Remove extension from user directory |
| `make link` | Create symlink for development |
| `make schemas` | Compile GSettings schemas |
| `make prefs` | Open extension preferences |
| `make logs` | Watch GNOME Shell logs |
| `make view-data` | Open dconf-editor for extension settings |

## 📦 Release Process

### 1. Update Version

Edit `src/metadata.json`:

```json
{
  "version": 5,
  "tag": 1.4,
  ...
}
```

- **version**: Integer, incremented with each release
- **tag**: String/number for human-readable version (e.g., `1.4`, `2.0`)

### 2. Test Thoroughly

- Install using `make install`
- Test all features (add/remove coins, change settings, etc.)
- Check logs for errors
- Test on multiple GNOME Shell versions if possible

### 3. Create Package

```bash
make package
```

This creates `archives/CryptoStash-v{TAG}.zip`

### 4. Commit and Tag

```bash
git add src/metadata.json archives/
git commit -m "Release v1.4"
git tag v1.4
git push origin main
git push origin v1.4
```

### 5. Upload to extensions.gnome.org

1. Go to [extensions.gnome.org](https://extensions.gnome.org/upload/)
2. Log in with your GNOME account
3. Upload the `.zip` file from `archives/`
4. Click "Upload extension"
5. Add release notes
6. Submit for review

## 🐛 Debugging Tips

### Using GNOME Shell's Looking Glass

1. Press `Alt+F2`
2. Type `lg` and press Enter
3. Navigate to the "Extensions" tab
4. Find "CryptoStash" to inspect state

## 📚 Key Technologies

### GNOME JavaScript (GJS)

CryptoStash is written in GJS, JavaScript bindings for GNOME libraries.

**Key imports:**
- `St`: Shell Toolkit for UI elements
- `Gio`: Input/output operations
- `Soup`: HTTP client library
- `GObject`: Object system for properties and signals

### GSettings

Used for persistent storage of user preferences.

Schema location: `src/schemas/org.gnome.shell.extensions.crypto-stash.gschema.xml`

### Extension System

- `extension.js`: Implements `init()`, `enable()`, `disable()`
- `prefs.js`: Implements preferences window with GTK4

## 🔗 Useful Resources


- [GNOME developer](https://developer.gnome.org/documentation/)
- [GJS Documentation](https://gjs.guide/)
- [GTK 4 Reference](https://gjs-docs.gnome.org/gtk40~4.0/)
- [Soup HTTP Library](https://gjs-docs.gnome.org/soup30/)
- [Creating GNOME Extensions](https://www.codeproject.com/Articles/5271677/How-to-Create-A-GNOME-Extension)
  [Pango markup](https://docs.gtk.org/Pango/pango_markup.html)
