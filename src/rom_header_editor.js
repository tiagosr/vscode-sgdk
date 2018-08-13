const vscode = require('vscode');

if (!String.prototype.padEnd) {
    String.prototype.padEnd = function padEnd(targetLength, padString) {
        targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
        padString = String((typeof padString !== 'undefined' ? padString : ' '));
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return String(this) + padString.slice(0, targetLength);
        }
    };
}

class RomHeader {
    constructor() {
        let now = new Date();
        this.console = "SEGA MEGA DRIVE "; // 16 bytes
        this.copyright = "(C)SOMETEAM "+now.getFullYear()+" ";
        
    }
    static trimPadString(str, length) {
        return str.padEnd(length, ' ').substr(0, length);
    }
}

exports.RomHeader = RomHeader;