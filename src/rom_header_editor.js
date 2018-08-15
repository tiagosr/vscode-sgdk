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

class FixedLengthString {
    constructor(length, initial, pad) {
        this.length = length
        this.pad = pad || ' '
        this.str = initial || ""
    }
    static trimPadString(str, length, padding) {
        return str.padEnd(length, padding || ' ').substr(0, length);
    }
    emit() {
        return trimPadString(this.str, this.length, this.pad)
    }
    charCodeAt(i) {
        if (this.str.length <= i) {
            return this.pad.charCodeAt(0);
        }
        return this.str.charCodeAt(i);
    }
}

class RomHeader {
    constructor() {
        let now = new Date();
        this.console = new FixedLengthString(16, "SEGA MEGA DRIVE");
        this.copyright = new FixedLengthString(16, "(C)SOMETEAM "+now.getFullYear());
        this.title_local = new FixedLengthString(48, "SAMPLE GAME");
        this.title_int = new FixedLengthString(48, "SAMPLE GAME");
        this.serial = new FixedLengthString(14, "GM 00000000-00");
        this.checksum = 0;
        this.io_support = new FixedLengthString(16, "JD");
        this.rom_start = 0;
        this.rom_end = 0x100000;
        this.ram_start = 0xff0000;
        this.ram_end = 0xffffff;
        this.have_sram = false;
        //this.sram_sig = new FixedLengthString(2, "RA");
        this.sram_type = 0;
        this.sram_start = 0x200000;
        this.sram_end = 0x2001ff;
        this.modem_support = new FixedLengthString(12, "");
        this.notes = new FixedLengthString(40, "WRITE YOUR NOTES HERE");
        this.region = new FixedLengthString(16, "JUE");
    }
    emitbuffer() {
        let buf = new ArrayBuffer(256);
        let bv = new Uint8ClampedArray(buf);
        for (var i = 0; i < 16; i++) {
            bv[i] = this.console.charCodeAt(i);
        }
        for (var i = 0; i < 16; i++) {
            bv[16+i] = this.copyright.charCodeAt(i);
        }
        for (var i = 0; i < 48; i++) {
            bv[32+i] = this.title_local.charCodeAt(i);
        }
        for (var i = 0; i < 48; i++) {
            bv[80+i] = this.title_int.charCodeAt(i);
        }
        for (var i = 0; i < 14; i++) {
            bv[128+i] = this.serial.charCodeAt(i);
        }
        // checksum bytes (to be filled in later)
        bv[142] = 0;
        bv[143] = 0;
        for (var i = 0; i < 16; i++) {
            bv[144+i] = this.io_support.charCodeAt(i);
        }
        // rom start (defaults to 0x000000)
        bv[160] = (this.rom_start >> 24) & 0xff;
        bv[161] = (this.rom_start >> 16) & 0xff;
        bv[162] = (this.rom_start >> 8) & 0xff;
        bv[163] = (this.rom_start) & 0xff;
        // rom end (should we calculate it on build end?)
        bv[164] = (this.rom_end >> 24) & 0xff;
        bv[165] = (this.rom_end >> 16) & 0xff;
        bv[166] = (this.rom_end >> 8) & 0xff;
        bv[167] = (this.rom_end) & 0xff;
        // ram start (defaults to 0xff0000)
        bv[168] = (this.ram_start >> 24) & 0xff;
        bv[169] = (this.ram_start >> 16) & 0xff;
        bv[170] = (this.ram_start >> 8) & 0xff;
        bv[171] = (this.ram_start) & 0xff;
        // ram end (defaults to 0xffffff)
        bv[172] = (this.ram_end >> 24) & 0xff;
        bv[173] = (this.ram_end >> 16) & 0xff;
        bv[174] = (this.ram_end >> 8) & 0xff;
        bv[175] = (this.ram_end) & 0xff;
        if (this.have_sram) {
            bv[176] = 'RA'.charCodeAt(0);
            bv[177] = 'RA'.charCodeAt(1);
        } else {
            bv[176] = '  '.charCodeAt(0);
            bv[177] = '  '.charCodeAt(1);
        }
        bv[178] = (this.sram_type >> 8) & 0xff;
        bv[179] = (this.sram_type) & 0xff;
        // sram start (normally 0x200000)
        bv[180] = (this.sram_start >> 24) & 0xff;
        bv[181] = (this.sram_start >> 16) & 0xff;
        bv[182] = (this.sram_start >> 8) & 0xff;
        bv[183] = (this.sram_start) & 0xff;
        // sram end (normally 0x2001ff)
        bv[184] = (this.sram_end >> 24) & 0xff;
        bv[185] = (this.sram_end >> 16) & 0xff;
        bv[186] = (this.sram_end >> 8) & 0xff;
        bv[187] = (this.sram_end) & 0xff;
        for (var i = 0; i < 12; i++) {
            bv[188+i] = this.modem_support.charCodeAt(i);
        }
        for (var i = 0; i < 40; i++) {
            bv[200+i] = this.notes.charCodeAt(i);
        }
        for (var i = 0; i < 16; i++) {
            bv[240+i] = this.region.charCodeAt(i);
        }
        return buf;
    }
}

exports.RomHeader = RomHeader;
