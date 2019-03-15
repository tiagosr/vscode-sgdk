const vscode = require("vscode")
const format = require("string-format")
const path = require("path")
const fs = require("fs")

class EmulatorView {
    /**
     * 
     * @param {vscode.ExtensionContext} context
     * @param {?string} webSocketServerAddr
     */
    constructor(context, webSocketServerAddr = null) {
        this.extensionPath = context.extensionPath;
        this.webSocketServerAddr = webSocketServerAddr
        /** @type {vscode.Disposable[]} */
        this.disposables = []
        this.panel = null
    }

    get viewType() { return "sgdk.emu.genplus" }
    get viewTitle() { return "Genesis Plus GX emulator" }
    get htmlFile() { return "genplus_em.html" }
    get htmlUrl() { return vscode.Uri.file(path.join(this.extensionPath, "resources", this.htmlFile)) }
    get baseUrl() { return vscode.Uri.file(path.join(this.extensionPath, "resources")) }
    
    /**
     * 
     * @param {vscode.ExtensionContext} context 
     */
    createView() {
        try {
            const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : vscode.ViewColumn.One
            this.panel = vscode.window.createWebviewPanel(this.viewType, this.viewTitle, {
                preserveFocus: true,
                viewColumn: column
            }, {
                enableScripts: true,
                retainContextWhenHidden: true,
                enableCommandUrls: true,
                localResourceRoots: [
                    this.baseUrl
                ]
            })
            this.panel.onDidDispose(() => { this.dispose() }, null, this.disposables)
            this.panel.webview.html = this.makeHtml()
            this.panel.webview.onDidReceiveMessage(this.onWebviewMessage)
            console.log(this.viewTitle + " Webview set up")
        } catch (err) {
            console.error(err)
        }
    }
    onWebviewMessage(message) {
        switch (message.command) {
        case "log":
            console.log(message.text)
            return;
        case "error":
            console.error(message.text)
            return;
        }
    }
    makeHtml() {
        const filename = path.join(this.extensionPath, "resources", this.htmlFile)
        const base_url = this.baseUrl.with({ scheme: "vscode-resource" }).toString()
        return fs.readFileSync(filename).toString().replace(/\{BASE_URL\}/g, base_url)
    }
    loadRom(filename) {
        this.panel.webview.postMessage({
            command: "loadRom",
            filename: filename
        })
    }
    dispose() {
        while(this.disposables.length) {
            const x = this.disposables.pop()
            if (x) {
                x.dispose()
            }
        }
    }
}

class PicoDriveEmulatorView extends EmulatorView {
    get viewType() { return "sgdk.emu.picodrive" }
    get viewTitle() { return "PicoDrive emulator" }
    get htmlFile() { return "PicoDrive.html" }
}

exports.EmulatorView = EmulatorView
exports.PicoDriveEmulatorView = PicoDriveEmulatorView
