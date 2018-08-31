const vscode = require("vscode")
const path = require("path")
const emu = require("./emu")

class TileEditor extends emu.EmulatorView {
    get viewType() { return "sgdk.tileeditor" }
    get viewTitle() { return "Tile Editor" }
}

exports.TileEditor = TileEditor

