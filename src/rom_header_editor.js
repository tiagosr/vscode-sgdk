import * as vscode from "vscode";

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
    /**
     * @param {number} length The length for the string to pad/trim to
     * @param {string} str string to pad or trim
     * @param {string} pad padding character (only the first character is used)
     */
    constructor(length, str, pad) {
        this.length = length
        this.pad = pad || ' '
        this.str = str || ""
    }
    /**
     * Pads/trims a string to a certain length with a certain pad character
     * @param {string} str The string to pad/trim
     * @param {number} length The length to pad/trim to
     * @param {string} padding The character to pad with (only the first character in the string is used)
     * @returns {string} The padded/trimmed string
     */
    static trimPadString(str, length, padding) {
        return str.padEnd(length, padding || ' ').substr(0, length);
    }
    /**
     * @returns {string} The final padded/trimmed string
     */
    emit() {
        return trimPadString(this.str, this.length, this.pad)
    }
    /**
     * Gets the character code within the string
     * @param {number} i Index within the pad/trim range
     */
    charCodeAt(i) {
        if (this.str.length <= i) {
            return this.pad.charCodeAt(0);
        }
        return this.str.charCodeAt(i);
    }
}

/**
 * @typedef {Object} RomHeaderObj
 * An object containing the specifications for entries in the header
 * @property {string} [console]
 * A string specifying the console that will run this progam (16 chars)
 * Normally either "SEGA MEGA DRIVE" or "SEGA GENESIS"
 * @property {string} [copyright]
 * A copyright string for the program (16 chars)
 * @property {string} [title_local]
 * Title within the local region (48 chars)
 * @property {string} [title_int]
 * Title outside the local region (48 chars)
 * @property {string} [serial]
 * Serial number (14 chars)
 * @property {number} [checksum]
 * Checksum within the header - can be overridden by calculated checksum
 * @property {string} [io_support]
 * I/O support (16 chars)
 * J for Joypad support
 * D for ?
 * @property {number} [rom_start]
 * Start address for ROM - in almost every situation it should be 0x000000
 * @property {number} [rom_end]
 * End address for ROM - in almost every situation it should be equal to rom_start + the size of the ROM chip(s) used
 * @property {number} [ram_start]
 * Start address for RAM - barring exceptional cases, internal MD RAM starts at 0xff0000
 * @property {number} [ram_end]
 * End address for RAM - barring exceptional cases, internal MD RAM ends at 0xffffff
 * @property {boolean} [have_sram]
 * True if program expects to have access to in-cartridge SRAM
 * @property {boolean} [sram_backup]
 * True if program expects SRAM to be battery-backed
 * @property {boolean} [sram_odd]
 * True if program expects to access SRAM through odd bytes in the address space
 * @property {boolean} [sram_even]
 * True if program expects to access SRAM through even bytes in the address space
 * @property {number} [sram_start]
 * Start address for SRAM
 * @property {number} [sram_end]
 * End address for SRAM
 * @property {string} [modem_support]
 * String specifying MODEM support
 * @property {string} [notes]
 * Anything goes (40 chars)
 * @property {string} [region]
 * Region specification (16 chars)
 * J for Japan
 * U for United States
 * E for Europe
 */

/**
 * Rom header (section) emitter
 */
class RomHeader {
    /**
     * @param {RomHeaderObj} header
     * An object containing the specifications for entries in the header
     */
    constructor(header) {
        let now = new Date();
        this.console = header.console || "SEGA MEGA DRIVE";
        this.copyright = header.copyright || ("(C)SOMETEAM "+now.getFullYear());
        this.title_local = header.title_local || "SAMPLE GAME";
        this.title_int = header.title_int || "SAMPLE GAME";
        this.serial = header.serial || "GM 00000000-00";
        this.checksum = header.checksum || 0;
        this.io_support = header.io_support || "JD";
        this.rom_start = header.rom_start || 0;
        this.rom_end = header.rom_end || 0x100000;
        this.ram_start = header.ram_start || 0xff0000;
        this.ram_end = header.ram_end || 0xffffff;
        this.have_sram = header.have_sram || false;
        this.sram_backup = header.sram_backup || false;
        this.sram_odd = header.sram_odd || false;
        this.sram_even = header.sram_even || false;
        this.sram_start = header.sram_start || 0x200000;
        this.sram_end = header.sram_end || 0x2001ff;
        this.modem_support = header.modem_support || "";
        this.notes = header.notes || "WRITE YOUR NOTES HERE";
        this.region = header.region || "JUE";
    }

    /**
     * Export a JSON saveable version of the currently-set data for the header
     * @returns {RomHeaderObj}
     */
    export() {
        return {
            console: this.console,
            copyright: this.copyright,
            title_local: this.title_local,
            title_int: this.title_int,
            serial: this.serial,
            checksum: this.checksum,
            io_support: this.io_support,
            rom_start: this.rom_start,
            rom_end: this.rom_end,
            ram_start: this.ram_start,
            ram_end: this.ram_end,
            have_sram: this.have_sram,
            sram_backup: this.sram_backup,
            sram_odd: this.sram_odd,
            sram_even: this.sram_even,
            sram_start: this.sram_start,
            sram_end: this.sram_end,
            modem_support: this.modem_support,
            notes: this.notes,
            region: this.region
        }
    }

    /** 
     * Emits an ArrayBuffer object that can be written directly to a file
     * @returns {ArrayBuffer} Buffer containing the emitted ROM header section
     */
    emitBuffer() {
        let buf = new ArrayBuffer(256);
        let bv = new Uint8ClampedArray(buf);
        let _console = new FixedLengthString(16, this.console);
        let _copyright = new FixedLengthString(16, this.copyright);
        let _title_local = new FixedLengthString(48, this.title_local);
        let _title_int = new FixedLengthString(48, this.title_int);
        let _serial = new FixedLengthString(14, this.serial);
        for (var i = 0; i < 16; i++) {
            bv[i] = _console.charCodeAt(i);
        }
        for (var i = 0; i < 16; i++) {
            bv[16+i] = _copyright.charCodeAt(i);
        }
        for (var i = 0; i < 48; i++) {
            bv[32+i] = _title_local.charCodeAt(i);
        }
        for (var i = 0; i < 48; i++) {
            bv[80+i] = _title_int.charCodeAt(i);
        }
        for (var i = 0; i < 14; i++) {
            bv[128+i] = _serial.charCodeAt(i);
        }
        // checksum bytes (to be filled in later)
        bv[142] = (this.checksum>>8) & 0xff;
        bv[143] = this.checksum & 0xff;
        let _io_support = new FixedLengthString(16, this.io_support, "\0");
        for (var i = 0; i < 16; i++) {
            bv[144+i] = _io_support.charCodeAt(i);
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
        let _sram_type = 0;
        if (this.have_sram) {
            bv[176] = 'RA'.charCodeAt(0);
            bv[177] = 'RA'.charCodeAt(1);
            _sram_type = 0x64;
            if (this.sram_backup) _sram_type += 0x80;
        } else {
            bv[176] = '  '.charCodeAt(0);
            bv[177] = '  '.charCodeAt(1);
        }
        bv[178] = (_sram_type >> 8) & 0xff;
        bv[179] = (_sram_type) & 0xff;
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
        let _modem_support = new FixedLengthString(12, this.modem_support, "\0");
        let _notes = new FixedLengthString(40, this.notes);
        let _region = new FixedLengthString(16, this.region);
        for (var i = 0; i < 12; i++) {
            bv[188+i] = _modem_support.charCodeAt(i);
        }
        for (var i = 0; i < 40; i++) {
            bv[200+i] = _notes.charCodeAt(i);
        }
        for (var i = 0; i < 16; i++) {
            bv[240+i] = _region.charCodeAt(i);
        }
        return buf;
    }
}

exports.RomHeader = RomHeader;
