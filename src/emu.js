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

    get viewType() { return "sgdkPicoEmu" }
    get viewTitle() { return "PicoDrive emulator" }
    get htmlFile() { return "PicoDrive.html" }
    get htmlUrl() { return vscode.Uri.file(path.join(this.extensionPath, "resources", this.htmlFile)).with({ scheme: "vscode-resource" }) }
    get baseUrl() { return vscode.Uri.file(path.join(this.extensionPath, "resources")+"/").with({scheme: "vscode-resource"}) }
    
    /**
     * 
     * @param {vscode.ExtensionContext} context 
     */
    createView() {
        try {
            const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : vscode.ViewColumn.One
            this.panel = vscode.window.createWebviewPanel(this.viewType, this.viewTitle, column, {
                enableScripts: true,
                enableFindWidget: false,
                localResourceRoots: [
                    path.join(this.extensionPath, "resources")
                ]
            })
            this.panel.onDidDispose(() => { this.dispose() }, null, this.disposables)
            this.panel.webview.html = this.makeHtml()
            this.panel.webview.onDidReceiveMessage(this.onWebviewMessage)
            console.log("oe?")
        } catch (err) {
            console.error(err)
        }
    }
    onWebviewMessage(message) {
        switch (message.command) {
        case "log":
            vscode.window.showInformationMessage(message.text)
            console.log(message.text)
            return;
        case "error":
            vscode.window.showErrorMessage(message.text)
            console.error(message.text)
            return;
        }
    }
    makeHtml() {
        return fs.readFileSync(path.join(this.extensionPath, "resources", this.htmlFile)).toString().replace(/\{BASE_URL\}/g, this.baseUrl.toString())
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

exports.EmulatorView = EmulatorView
