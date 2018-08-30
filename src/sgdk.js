const vscode = require("vscode")
const child_process = require("child_process")
const fs = require("fs")
const DepGraph = require("dependency-graph").DepGraph
const path = require("path")
const os = require("os")
const format = require("string-format")

format.extend(String.prototype, {});

/**
 * @typedef {Object} DefineItem
 * An object containing the symbol and optional value for a define
 * @property {string} key Pre-processor symbol #define
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
 * @property {string} [output_file]
 * Output file name (relative to the workspace root)
 */

/**
 * @typedef {Object} ASOptionsObj
 * @property {DefineItem[]} [defines]
 * List of Preprocessor #defines to pass to the compiler
 * @property {string[]} [flags]
 * List of flags to pass on to the C Compiler
 * @property {string} [base_sdk]
 * Base SGDK path
 * @property {string} [as_path]
 * AS assembler path
 * @property {string} [output_file]
 * Output file name (relative to the workspace root)
 */

/**
 * @typedef {Object} LDOptionsObj
 * @property {string} [linker_file]
 * @property {string[]} [flags]
 * @property {string[]} [libraries]
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
            include_paths: ["inc"],
            defines: [],
            flags: ["-m68000", "-Wall", "-O1", "-fomit-frame-pointer", "-fno-builtin-memset", "-fno-builtin-memcpy"],
        }
    }

    /**
     * Defaults for the C Compiler options - Debug mode
     * @returns {CCOptionsObj}
     */
    static defaultsDebug() {
        return {
            include_paths: ["inc"],
            defines: [{key:"_DEBUG"}],
            flags: ["-g3", "-m68000", "-Wall", "-fomit-frame-pointer", "-fno-builtin-memset", "-fno-builtin-memcpy", "-O1"],
        }
    }

    /**
     * 
     * @param {?CCOptionsObj} options 
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
    static mapDefine(define) { return "-D"+define.key+(("value" in define)? "="+define.value : "") }

    /**
     * 
     * @param {string} inc_path Single include path to join
     * @returns {string}
     */
    mapIncludePath(inc_path) { return "-I\""+path.join(this.options.base_sdk, inc_path)+"\"" }
    /** @returns {string} */
    getIncludes() {
        return this.options.include_paths.map(this.mapIncludePath).join(" ")
    }
    /** @returns {string} */
    getDefines() {
        return this.options.defines.map(CCOptions.mapDefine).join(" ")
    }
    /** @returns {string} */
    getFlags() {
        return this.options.flags.join(" ")
    }
}

class ASOptions {
    /** @returns {ASOptionsObj} */
    static defaults() {
        return {
            defines: [],
        }
    }
    /** @returns {ASOptionsObj} */
    static defaultsDebug() {
        return {
            defines: [{key: "_DEBUG"}],
        }
    }

    /**
     * 
     * @param {?ASOptionsObj} options 
     */
    constructor(options) {
        /** @type {ASOptionsObj} */
        this.options = Object.assign({}, ASOptions.defaults(), options)
    }

    getASPath() {
        return path.join(
            this.options.base_sdk || vscode.workspace.getConfiguration().get("sgdk.basePath"),
            this.options.as_path || vscode.workspace.getConfiguration().get("sgdk.as.command")
        )
    }
}

class LDOptions {
    /** @return {LDOptionsObj} */
    static defaults() {
        return {
            linker_file: "md.ld",
            flags: ["-nostdlib", "--oformat binary"],
            libraries: ["libmd.a"]
        }
    }

    /** @return {LDOptionsObj} */
    static defaultsDebug() {
        return {
            linker_file: "md.ld",
            flags: ["-nostdlib", "--oformat binary"],
            libraries: ["libmd.a"]
        }
    }



    /**
     * 
     * @param {LDOptionsObj} options 
     */
    constructor(options) {
        this.options = Object.assign({}, LDOptions.defaults(), options)
    }

    getLDPath() {
        return path.join(
            this.options.base_sdk || vscode.workspace.getConfiguration().get("sgdk.basePath"),
            this.options.ld_path || vscode.workspace.getConfiguration().get("sgdk.ld.command")
        )
    }

    getFlags() {
        return this.flags.join(" ")
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
            "{cc} {flags} {defines} {includes} -c {filename_in} -o {filename_out}".format({
                cc: this.options.getCCPath(),
                flags: this.options.getFlags(),
                defines: this.options.getDefines(),
                includes: this.options.getIncludes(),
                filename_in: this.filename_in,
                filename_out: this.filename_out
            })
        )
        compiling.on("exit", this.on_exit)
        compiling.stderr.on("data", this.on_stderr)
        compiling.stdout.on("data", this.on_stdout)
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
        compiling.on("exit", this.on_exit)
        compiling.stdout.on("data", this.on_stdout)
        compiling.stderr.on("data", this.on_stderr)
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
                filenames_in: this.filenames_in.join(" ")
            })
        )
        linking.on("exit", this.on_exit)
        linking.stdout.on("data", this.on_stdout)
        linking.stderr.on("data", this.on_stderr)
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

class FileConfig {
    /**
     * 
     * @param {string[]} file_paths 
     */
    constructor(file_paths) {
        this.file_paths = file_paths
    }
    /** @type {string[]} */
    get output_file_paths() { return this.file_paths }
    /** @type {string[]} */
    get dependencies() { return [] }
}

class CFileConfig extends FileConfig {
    /**
     * File configuration for each compile unit
     * @param {string} file_path 
     * @param {?CCOptionsObj} cc_options 
     */
    constructor(file_path, cc_options) {
        super([file_path])
        this.cc_options = cc_options
    }
    get output_file_paths() {
        return [this.cc_options.output_file || CFileConfig.map_input_filename_to_output(this.file_path)]
    }
    static map_input_filename_to_output(filename) {
        return filename.substr(0, filename.lastIndexOf("."))+".o"
    }
}

class SFileConfig extends FileConfig {
    /**
     * 
     * @param {string} file_path 
     * @param {?ASOptionsObj} as_options 
     */
    constructor(file_path, as_options) {
        super([file_path])
        this.as_options = as_options
    }
    get output_file_paths() {
        return [this.cc_options.output_file || SFileConfig.map_input_filename_to_output(this.file_path)]
    }
    static map_input_filename_to_output(filename) {
        return filename.substr(0, filename.lastIndexOf(".")) + ".o"
    }
}

class RomHeaderFileConfig extends FileConfig {
    constructor() {
        super(["rom_header.json"])
    }
    get output_file_paths() {
        return ["out/rom_header.bin"]
    }
}

class RomFileConfig extends FileConfig {
    constructor(files_path, ld_options) {
        super(["sega.o"])
    }
}

class BuildConfig {
    static defaults() {
        return [
            new BuildConfig("Release", CCOptions.defaults(), ASOptions.defaults(), LDOptions.defaults()),
            new BuildConfig("Debug", CCOptions.defaultsDebug(), ASOptions.defaultsDebug(), LDOptions.defaultsDebug())
        ]
    }
    /**
     * 
     * @param {string} name
     * @param {CCOptionsObj} cc_options 
     * @param {ASOptionsObj} as_options 
     * @param {LDOptionsObj} ld_options
     */
    constructor(name, cc_options, as_options, ld_options) {
        this.name = name
        this.cc_options = cc_options
        this.as_options = as_options
        this.ld_options = ld_options
    }
}

class ProjectCompiler {
    /**
     * 
     * @param {string[]} files 
     * @param {string} file_out 
     * @param {BuildConfig} project_config 
     */
    constructor(files, file_out, project_config) {
        this.depgraph = new DepGraph()
        this.end_node = file_out
        this.depgraph.addNode(file_out)
        for (const file of files) {
            this.depgraph.addNode(file)
        }
        this.project_config = project_config
    }

    static mapFileToCompiler(file, overrides) {

    }
}


exports.CCOptions = CCOptions
exports.ASOptions = ASOptions
exports.LDOptions = LDOptions
exports.CCLauncher = CCLauncher
exports.ASLauncher = ASLauncher
exports.LDLauncher = LDLauncher
exports.BuildConfig = BuildConfig
exports.ProjectCompiler = ProjectCompiler
