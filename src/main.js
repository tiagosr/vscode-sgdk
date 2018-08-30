const vscode = require("vscode")
const fs = require("fs")
const path = require("path")
const emu = require("./emu")
const sgdk = require("./sgdk")

var sgdkConfig = undefined;
/** @type {string} */
var folder = undefined;

/**
 * 
 * @param {string} config_folder 
 * @param {string} config_file 
 */
function createProjectFile(config_folder, config_file) {
    let config = {
        buildConfigs: sgdk.BuildConfig.defaults()
    }
    let config_str = JSON.stringify(config, null, 4)
    if (!fs.existsSync(config_folder)) {
        fs.mkdirSync(config_folder)
    }
    fs.writeFileSync(config_file, config_str)
    vscode.window.showInformationMessage("Configuration file .vscode/sgdk.json written successfully")

    if (vscode.workspace.getConfiguration().get("sgdk.basePath") == null) {
        vscode.window.showWarningMessage("Please set sgdk.basePath to the path of your SGDK installation!")
    }
}

/**
 * 
 * @param {vscode.ExtensionContext} context 
 */
function activate(context) {

    let cmd_init_project = vscode.commands.registerCommand("sgdk.initProject", function () {
        folder = vscode.workspace.rootPath
        let config_folder = path.join(folder, ".vscode")
        let config_file = path.join(config_folder, "sgdk.json")
        if (fs.existsSync(config_file)) {
            const choices = ["Overwrite .vscode/sgdk.json", "Don't overwrite"]
            vscode.window.showQuickPick(choices, {placeHolder: "Do you want to overwrite your workspace's .vscode/sgdk.json?"}).then(
                (chosen)=>{
                    if (choices.indexOf(chosen) != 0) {
                        vscode.window.showInformationMessage("SGDK project init cancelled.")
                        return
                    } else {
                        createProjectFile(config_folder, config_file)
                    }
                },
                (reason)=> {
                    vscode.window.showInformationMessage("SGDK project init cancelled.")
                }
            )
        } else {
            createProjectFile(config_folder, config_file)
        }
        
    })
    let cmd_build = vscode.commands.registerCommand("sgdk.build", function() {
        if (!vscode.workspace.rootPath)
            return;
        folder = vscode.workspace.rootPath;
        let config_file = folder + "/.vscode/sgdk.json";
        if (fs.existsSync(config_file)) {
            //
        } else {
            vscode.window.showInformationMessage("No SGDK Project configuration file found");
        }
        
        // https://github.com/politoleo/iar/blob/master/src/main.js
    })
    let cmd_open_picodrive = vscode.commands.registerCommand("sgdk.picodrive", function () {
        let pico = new emu.EmulatorView(context)
        pico.createView()
    })

    context.subscriptions.push(cmd_init_project, cmd_build, cmd_open_picodrive)
}

function deactivate() {

}

exports.activate = activate;
exports.deactivate = deactivate;