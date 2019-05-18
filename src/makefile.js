const vscode = require("vscode")
const child_process = require("child_process")
const format = require("string-format")
const fs = require("fs")
const os = require("os")
const path = require("path")

format.extend(String.prototype, {});
