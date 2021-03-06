NAME := $(shell jq '.name' ./src/metadata.json)
UUID := $(shell jq '.uuid' ./src/metadata.json)
TAG := $(shell jq '.tag' ./src/metadata.json)

ZIPFILE = archives/$(NAME)-v${TAG}.zip
EXTENSION_PATH_RELATIVE=.local/share/gnome-shell/extensions/$(UUID)
EXTENSION_PATH = $(HOME)/$(EXTENSION_PATH_RELATIVE)

.PHONY: package
package: $(ZIPFILE)

$(ZIPFILE): src/metadata.json schemas
	-rm -f $(ZIPFILE)
	cd src/ && zip ../$(ZIPFILE) * schemas/*

.PHONY: schemas
schemas:
	glib-compile-schemas src/schemas/

.PHONY: uninstall
uninstall:
	rm -rf $(EXTENSION_PATH)

.PHONY: install
install: package
	rm -rf $(EXTENSION_PATH)
	mkdir -p $(EXTENSION_PATH)
	unzip $(ZIPFILE) -d $(EXTENSION_PATH)

.PHONY: link
link:
	rm -rf $(EXTENSION_PATH)
	ln -s ${PWD}/src $(EXTENSION_PATH)

.PHONY: prefs
prefs:
	gnome-extensions prefs $(UUID)

.PHONY: logs
logs:
	journalctl /usr/bin/gnome-shell -f

.PHONY: view-data
view-data:
	dconf-editor /org/gnome/shell/extensions/crypto-stash/
