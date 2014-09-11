#!/usr/bin/env node

/*global global process */
var fs = require('fs');
var path = require('path');
var util = require('util');
var repl = require('repl');

var Case = require('case');
var treeify = require('treeify');
var operandi = require('operandi');
var prise = require('prise');
var argv = require('minimist')(process.argv.slice(2));


// start repl session
var session = repl.start({});
session.context.__errors = {};


// default rebelle configuration
session.rebelle = {
	ignoreRCFiles: false,
	ignoreRCFileInHome: false,
	ignoreRCFileInProjects: true
};

var homedir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var cwd = process.cwd();
var requireList = []; // store packages that will get required into the session

// register some helper functions globally to make them accessible from rc files
global.print = print;

operandi.serial([
	loadRebelleUserSettings,
	initializeRebellePlugins,
	handleCommandLineArgument,
	initializeRCFiles
], initializationResult);


function initializationResult(err) {
	if (err) {
		console.error(err);
		process.exit(1);
	}

	// output a message about what has been loaded into the session
	var result = {success: 0, failure: 0};
	var report = treeify.asTree(requireList.reduce(function (a, module) {
		var status = loadModule(module);

		a[module.name] = [
			module.packageName,
			module.version ? '@'+module.version : undefined,
			status.loaded ? undefined : ' (FAILED)',
			status.empty ? ' (empty)' : undefined
		].join('');

		result[status.loaded ? 'success' : 'failure'] += 1;

		return a;
	}, {}), true);

	print(
		report,
		result.failure ? 'Some modules failed to load, type `__errors` for details' : undefined,
		[result.success, 'file'+(result.success!==1?'s':''), 'loaded'].join(' '),
		'cwd: ' + process.cwd()
	);

	session.emit('initialized');
}


function loadRebelleUserSettings(done) {
	var package = { main: 'index.js' }; // default to index.js

	var userDir = path.resolve(homedir, '.rebelle');
	if (hasPackageJson(userDir)) {
		package = require(path.join(userDir, 'package.json'));
		package.main = package.main || 'index.js';
	}

	var mainFile = path.resolve(userDir, package.main);
	if (fs.existsSync(mainFile) && fs.statSync(mainFile).isFile()) {
		try {
			require(path.resolve(userDir, package.main))(session);
		} catch(err) {
			done(err);
		};
	}

	done();
}


function initializeRebellePlugins(done) {
	var userDir = path.resolve(homedir, '.rebelle');

	if (! hasNodeModulesDir(userDir)) {
		// no plugin dir, move along!
		return done();
	}

	prise(path.resolve(userDir, 'node_modules'), 'rebelle-', function(err, plugins) {
		if (err) {
			return done(err);
		}

		plugins.forEach(function(plugin) {
			try {
				require(plugin.main)(session);
			}
			catch(err) {
				err.plugin = plugin.name;
				if (err.message === 'object is not a function') {
					err.hint = 'Plugins should export a function';
				}
				done(err);
			}
		});
		done();
	});
}


function handleCommandLineArgument(done) {
	var arg = argv._[0]
	// initialized with js file
	if(path.extname(arg) === '.js' && fs.existsSync(arg) && fs.statSync(arg).isFile()) {
		// attach node module to session
		requireList.push({
			name: normalizeName(path.basename(arg, '.js')),
			packageName: path.resolve(cwd, arg),
			path: path.resolve(cwd, arg)
		});

		registerArbitraryModules();
	}
	else {
		var dir;
		// no arg, try to auto detect a module by traversing the file system upwards
		if (! arg) {
			dir = resolvePackageDir(cwd);
		}
		// initialized with a package.json file
		else if (path.basename(arg) === 'package.json' && fs.existsSync(arg) && fs.statSync(arg).isFile()) {
			dir = path.dirname(path.resolve(cwd, arg));
		}
		// initialized with a directory
		else if(fs.existsSync(arg) && fs.statSync(arg).isDirectory()) {
			dir = path.resolve(cwd, arg);
		}

		process.chdir(dir);

		registerModule(dir);
		registerDependencies(dir);
		registerArbitraryModules();
	}

	done();
}


function initializeRCFiles(done) {
	if (! session.rebelle.ignoreRCFiles) {
		// find and load rc file in the user home dir
		if (! session.rebelle.ignoreRCFileInHome) {
			loadRunCommandsFile(homedir);
		}

		// find and load rc file in project dir
		if (! session.rebelle.ignoreRCFileInProjects) {
			loadRunCommandsFile(process.cwd());
		}
	}

	function loadRunCommandsFile(dir) {
		var file = path.join(dir, '.rebellerc.js');
		if (fs.existsSync(file) && fs.statSync(file).isFile()) {
			try {
				require(file)(session);
				return true;
			}
			catch(err) {
				err.file = file;
				if (err.message === 'object is not a function') {
					err.hint = 'Plugins should export a function';
				}
				done(err);
			}
		}
		return false;
	}

	done();
}


// helper functions ------------------------------------------------
function print() {
	var message = Array.prototype.slice.call(arguments);
	message = message.filter(Boolean).join('\n');

	if (! message) {
		// do not interrupt the user
		return;
	}

	var prompt = session.prompt;
	session.prompt = '';
	session.displayPrompt();
	session.outputStream.write(message + '\n');

	session.prompt = prompt;
	session.displayPrompt();
}


function hasPackageJson(dir) {
	var packageJson = path.join(dir, 'package.json');
	return fs.existsSync(packageJson) && fs.statSync(packageJson).isFile();
}


function hasNodeModulesDir(dir) {
	var node_modules = path.join(dir, 'node_modules');
	return fs.existsSync(node_modules) && fs.statSync(node_modules).isDirectory();
}


function loadModule(module) {
	var status = { loaded: true, empty: false };
	try {
		session.context[module.name] = require(module.main || module.path);

		if (typeof session.context[module.name] === 'object') {
			if (! Object.keys(session.context[module.name]).length) {
				status.empty = true;
			}
		}

		delete session.context.__errors[module.name];

		session.emit('require:success', module);
	}
	catch (err) {
		session.context.__errors[module.name] = {
			module: module.name,
			version: module.version,
			path: module.path,
			main: module.main,
			type: err.name,
			message: err.message,
			stack: err.stack
		};

		status.loaded = false;

		session.emit('require:failure', module);
	}

	return status;
}


// normalizeName should translate spaces and dashes into camelCased
// strings, unless it is a snake_cased string.
function normalizeName(input) {
	if (input === 'case') {
		return 'Case';
	}
	return Case.of(input) === 'snake' ? input : Case.camel(input);
}


// attempt to find a package.json file by crawling up the file tree
// until it find a folder with a file called "package.json" or a
// directory called node_modules
function resolvePackageDir(cwd) {
	for (var dir = cwd.split(path.sep); dir.length; dir.pop()) {
		var current = path.sep + path.join.apply(this, dir, path.sep);

		if (hasPackageJson(current) || hasNodeModulesDir(current)) {
			return current;
		}
	}

	return cwd;
}


// Include a module to the repl session
function registerModule(packagePath) {
	if (! hasPackageJson(packagePath)) {
		return;
	}

	var package = require(path.join(packagePath, 'package.json'));
	package.main = package.main || 'index.js';

	// attach node module to session
	requireList.push({
		name: normalizeName(package.name),
		packageName: package.name,
		path: packagePath,
		main: path.join(packagePath, package.main),
		version: package.version
	});
}


// Handle dependencies
function dependencyBlacklist(current) {
	return current !== '.bin';
}

function registerDependencies(packagePath) {
	if (! hasNodeModulesDir(packagePath)) {
		return;
	}

	var node_modules = path.join(packagePath, 'node_modules');

	fs.readdirSync(node_modules).filter(dependencyBlacklist).forEach(function(current) {
		registerModule(path.join(node_modules, current));
	});
}


// Load arbitrary commonjs modules
function filterArgs(arg) {
	return arg !== '_';
}

function registerArbitraryModules() {
	Object.keys(argv).filter(filterArgs).forEach(function(current) {
		var scriptPath = path.resolve(process.cwd(), argv[current]);
		requireList.push({
			name: normalizeName(current),
			packageName: scriptPath,
			path: scriptPath
		});
	});
}
