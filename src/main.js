const vscode = require('vscode');
const fs = require('fs');

var sgdkConfig = undefined;
var folder = undefined;
function activate(context) {
    if (!vscode.workspace.rootPath)
        return;
    folder = vscode.workspace.rootPath;
    let config_file = folder + "/.vscode/sgdk.json";
    let spriteEditorUri = vscode.Uri.parse('sgdk://authority/sgdk-sprite');
    let tileEditorUri = vscode.Uri.parse('sgdk://authority/sgdk-tile');
    let musicTrackerUri = vscode.Uri.parse('sgdk://authority/sgdk-tracker');

    let cmd_build = vscode.commands.registerCommand('sgdk.build', function() {
        if (fs.existsSync(config_file)) {

        } else {
            vscode.window.showInformationMessage("No SGDK Project configuration file found");
        }
        
        // https://github.com/politoleo/iar/blob/master/src/main.js
    });
    context.subscriptions.push(cmd_build);
}

function deactivate() {

}

exports.activate = activate;
exports.deactivate = deactivate;