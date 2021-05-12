### Install extension locally

```
$ ln -s "${PWD}/src/" ~/.local/share/gnome-shell/extensions/cryptostash@filidorwiese.nl
```

### Debugging logs

```
$ journalctl -f /usr/bin/gnome-shell
```

### Open prefs dialog
```
$ gnome-extensions prefs cryptostash@filidorwiese.nl
```

### Compiling schema

```
$ glib-compile-schemas src/schemas/
```

### Viewing stored data

```
$ dconf-editor
```

### Useful Links

- https://www.codeproject.com/Articles/5271677/How-to-Create-A-GNOME-Extension
- https://gjs.guide/extensions/overview/anatomy.html#contents
- https://developer.gnome.org/gtk3/stable/
- https://gjs-docs.gnome.org/gtk30~3.24.26/
- https://www.roojs.com/seed/gir-1.2-gtk-3.0/gjs/Gtk.Label.html
