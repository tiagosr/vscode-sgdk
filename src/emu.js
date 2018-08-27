const vscode = require("vscode")
const WebSocket = require("ws")
const format = require("string-format")
const path = require("path")
const fs = require("fs")

class WebSocketServer {
    constructor(onListening) {
        this.server = new WebSocket.Server({port: 0})
        /** @type {WebSocket} */
        this.websocket = null;
        this.server.on("listening", ()=> {
            const url = format("ws://127.0.0.1:{port}", {port: this.server._server.address().port})
            onListening(url)
            this.server.on("connection", (websocket) => {
                this.websocket = websocket
            })
        })
    }
    send(code) {
        if (this.websocket != undefined) {
            this.websocket.send(code)
        }
    }
    dispose() {
        this.websocket.close()
    }
}

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
    get htmlUrl() { return vscode.Uri.file(path.join(this.extensionPath, "resources", this.htmlFile)) }
    
    /**
     * 
     * @param {vscode.ExtensionContext} context 
     */
    createView() {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined

        this.panel = vscode.window.createWebviewPanel(this.viewType, this.viewTitle, column || vscode.viewColumn.One, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.extensionPath, "resources"))
            ]
        })
        this.panel.onDidDispose(()=>{ this.dispose() }, null, this.disposables)
        this.panel.webview.html = this.makeHtml()
    }
    makeHtml() {
        return fs.readFileSync(path.join(this.extensionPath, "resources", this.htmlFile))
    }
    loadRom(filename) {

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
