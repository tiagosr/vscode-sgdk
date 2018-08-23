const vscode = require("vscode")
const path = require("path")

class TileEditor {
    static get viewtype() { return "sgdk-tileeditor" }
    constructor(extensionpath) {
        this.panel = vscode.window.createWebviewPanel(TileEditor.viewtype, vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(extensionpath, "resources"))
            ]
        })
        
    }
}

exports.TileEditor = TileEditor

