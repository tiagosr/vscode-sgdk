import * as vscode from "vscode";
import * as child_process from "child_process";
import * as fs from "fs";
import { DepGraph } from "dependency-graph";
import * as path from "path";
import * as os from "os";
import * as format from "string-format";

format.extend(String.prototype, {});

/**
 * @typedef {Object} DefineItem
 * An object containing the symbol and optional value for a define
 * @property {string} symbol Pre-processor symbol #define
 * @property {string} [value] Optional value for the #define
 */

/**
 * @typedef {Object} CCOptionsObj
 * @property {string[]} [include_paths]
 * List of paths to search for system include files
 * @property {DefineItem[]} [defines]
 * List of Preprocessor #defines to pass to the compiler
 * @property {string[]} [flags]
 * List of flags to pass on to the C Compiler
 * @property {string} [base_sdk]
 * Base SGDK path
 * @property {string} [cc_path]
 * C Compiler path
 */

 /**
  * C Compiler options definition object
  */
class CCOptions {
    /**
     * Defaults for the C Compiler options
     * @returns {CCOptionsObj}
     */
    static defaults() {
        return {
            include_paths: ['inc'],
            defines: [],
            flags: ['-m68000', '-Wall', '-fno-builtin'],
            cc_path: "bin/gcc"
        }
    }

    /**
     * 
     * @param {CCOptionsObj} options 
     */
    constructor(options) {
        /** @type {CCOptionsObj} */
        this.options = Object.assign({}, CCOptions.defaults(), options);
    }

    /** @returns {string} The joined path for the C Compiler */
    getCCPath() {
        return path.join(this.options.base_sdk, this.options.cc_path)
    }

    /**
     * @param {DefineItem} define Define symbol entry
     * @returns {string} String with -D prepended to it (and value, if set)
     */
    static mapDefine(define) { return '-D'+define.key+(('value' in define)? "="+define.value : "") }

    /**
     * 
     * @param {string} inc_path Single include path to join
     * @returns {string}
     */
    mapIncludePath(inc_path) { return '-I\"'+path.join(this.options.base_sdk, inc_path)+"\"" }
    /** @returns {string} */
    getIncludes() {
        return this.options.include_paths.map(this.mapIncludePath).join(' ')
    }
    /** @returns {string} */
    getDefines() {
        return this.options.defines.map(mapDefine).join(' ')
    }
    /** @returns {string} */
    getFlags() {
        return this.options.flags.join(' ')
    }
}

class ASOptions {
    constructor() {
        /** @member {DefineItem[]} ASOptions.defines */
        this.defines = []
        this.base_sdk = ""
        this.as_path = "bin/as"
    }

    getASPath() {
        return path.join(this.base_sdk, this.as_path)
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

class CCLauncher {
    /**
     * 
     * @param {CCOptions} options Compiler options
     * @param {string} filename_in Input file
     * @param {string} filename_out Output compiled file
     */
    constructor(options, filename_in, filename_out) {
        this.options = options
        this.filename_in = filename_in
        this.filename_out = filename_out
    }

    /**
     * @returns {ChildProcess}
     */
    compile() {
        let compiling = child_process.exec(
            "{gcc} {flags} {defines} {includes} -c {filename_in} -o {filename_out}".format({
                gcc: this.options.getCCPath(),
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

class ASLauncher {
    /**
     * 
     * @param {ASOptions} options 
     * @param {string} filename_in 
     * @param {string} filename_out 
     */
    constructor(options, filename_in, filename_out) {
        this.options = options
        this.filename_in = filename_in
        this.filename_out = filename_out
    }

    compile() {
        let compiling = child_process.exec(
            "{gas} -o {filename_out} {filename_in}".format({
                gas: this.options.getASPath(),
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

    listDependencies() {
        let dependencies = {}
        let content = fs.readFileSync(this.filename_in)
        
    }
}

class LDLauncher {
    /**
     * 
     * @param {LDOptions} options 
     * @param {string} start_file 
     * @param {string[]} filenames_in 
     * @param {string} filename_out 
     */
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

class ProjectCompiler {
    constructor(gcc_options, gas_options, ld_options, files, file_out) {
        this.depgraph = new DepGraph();
        this.depgraph.addNode('rom_output', file_out);
    }

    static mapFileToCompiler(file, overrides) {

    }
}

exports.CCOptions = CCOptions;
exports.ASOptions = ASOptions;
exports.LDOptions = LDOptions;
exports.CCLauncher = CCLauncher;
exports.ASLauncher = ASLauncher;
exports.LDLauncher = LDLauncher;
exports.ProjectCompiler = ProjectCompiler;
