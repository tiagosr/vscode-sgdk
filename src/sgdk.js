const vscode = require('vscode');
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const format = require('string-format');

format.extend(String.prototype, {});


class GCCOptions {
    constructor() {
        this.include_paths = ['inc']
        this.defines = []
        this.flags = ['-m68000', '-Wall', '-fno-builtin']
        this.base_sdk = ""
        this.gcc_path = "bin/gcc"
    }

    getGCCPath() {
        return path.join(this.base_sdk, this.gcc_path)
    }
    static mapDefine(define) { return '-D'+define }
    mapIncludePath(inc_path) { return '-I'+path.join(this.base_sdk, inc_path) }
    getIncludes() {
        return this.include_paths.map(this.mapIncludePath).join(' ')
    }
    getDefines() {
        return this.defines.map(mapDefine).join(' ')
    }
    getFlags() {
        return this.flags.join(' ')
    }
}

class GASOptions {
    constructor() {
        this.defines = []
        this.base_sdk = ""
        this.gas_path = "bin/as"
    }

    getGASPath() {
        return path.join(this.base_sdk, this.gas_path)
    }
}

class LDOptions {
    constructor() {
        this.linker_file = 'md.ld'
        this.flags = ['-nostdlib', '--oformat binary']
        this.libraries = ['libmd.a']
        this.base_sdk = ""
        this.ld_path = "bin/ld"
    }

    getLDPath() {
        return path.join(this.base_sdk, this.ld_path)
    }

    getFlags() {
        return this.flags.join(' ')
    }
}

class GCCLauncher {
    constructor(options, filename_in, filename_out) {
        this.options = options
        this.filename_in = filename_in
        this.filename_out = filename_out
    }

    compile() {
        let compiling = child_process.exec(
            "{gcc} {flags} {defines} {includes} -c {filename_in} -o {filename_out}".format({
                gcc: this.options.getGCCPath(),
                flags: this.options.getFlags(),
                defines: this.options.getDefines(),
                includes: this.options.getIncludes(),
                filename_in: this.filename_in,
                filename_out: this.filename_out
            })
        )
        compiling.on('exit', this.on_exit)
        compiling.stderr.on('data', this.on_stderr)
        compiling.stdout.on('data', this.on_stdout)
        return compiling
    }

    on_exit(code, signal) {
        if (code === null) {
            // some grave error here
            return
        }
        if (code === 0) {
            // successful, go on with the compile process
        } else {
            // gcc returned an error: let's signal this to the user
        }
    }

    on_stderr(chunk) {

    }

    on_stdout(chunk) {

    }
}

class GASLauncher {
    constructor(options, filename_in, filename_out) {
        this.options = options
        this.filename_in = filename_in
        this.filename_out = filename_out
    }

    compile() {
        let compiling = child_process.exec(
            "{gas} -o {filename_out} {filename_in}".format({
                gas: this.options.getGASPath(),
                filename_in: this.filename_in,
                filename_out: this.filename_out
            })
        )
        compiling.on('exit', this.on_exit)
        compiling.stdout.on('data', this.on_stdout)
        compiling.stderr.on('data', this.on_stderr)
        return compiling
    }
    
    on_exit(code, signal) {
        if (code === null) {
            // some grave error here
            return
        }
        if (code === 0) {
            // successful, go on with the compile process
        } else {
            // gcc returned an error: let's signal this to the user
        }
    }

    on_stderr(chunk) {

    }

    on_stdout(chunk) {

    }
}

class LDLauncher {
    constructor(options, start_file, filenames_in, filename_out) {
        this.options = options
        this.start_file = start_file
        this.filenames_in = filenames_in
        this.filename_out = filename_out
    }

    link() {
        let linking = child_process.exec(
            "{ld} -T {linker_file} {flags} -o {filename_out} {filenames_in}".format({
                ld: this.options.getLDPath(),
                linker_file: this.options.linker_file,
                flags: this.options.getFlags(),
                filename_out: this.filename_out,
                filenames_in: this.filenames_in.join(' ')
            })
        )
        linking.on('exit', this.on_exit)
        linking.stdout.on('data', this.on_stdout)
        linking.stderr.on('data', this.on_stderr)
        return linking
    }
    on_exit(code, signal) {
        if (code === null) {
            // some grave error here
            return
        }
        if (code === 0) {
            // successful, go on with the compile process
        } else {
            // gcc returned an error: let's signal this to the user
        }
    }

    on_stderr(chunk) {

    }

    on_stdout(chunk) {

    }
}

exports.GCCLauncher = GCCLauncher;
exports.GASLauncher = GASLauncher;
exports.LDLauncher = LDLauncher;