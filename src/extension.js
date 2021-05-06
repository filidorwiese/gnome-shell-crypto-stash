const {St, Clutter} = imports.gi;
const Main = imports.ui.main;

let panelButton;

function init () {
  // Create a Button with "Hello World" text
  panelButton = new St.Bin({
    style_class : "panel-button",
  });
  let panelButtonText = new St.Label({
    text : "...",
    y_align: Clutter.ActorAlign.CENTER,
  });
  panelButton.set_child(panelButtonText);
}

function enable () {
  // Add the button to the panel
  Main.panel._rightBox.insert_child_at_index(panelButton, 0);
}

function disable () {
  // Remove the added button from panel
  Main.panel._rightBox.remove_child(panelButton);
}
