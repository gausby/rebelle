#!/usr/bin/env node

/*global process */
var argv = require('minimist')(process.argv.slice(2));
var Case = require('case');
var treeify = require('treeify');
var path = require('path');
var fs = require('fs');
var repl = require('repl');

var cwd = process.cwd();

var requireList = [];

initialize(argv._[0]);

function initialize(arg) {
	var dir;

	// initialized with js file
	if(path.extname(arg) === '.js' && fs.existsSync(arg) && fs.statSync(arg).isFile()) {
		// attach node module to session
		requireList.push({
			name: normalizeName(path.basename(arg, '.js')),
			packageName: path.resolve(cwd, arg),
			path: path.resolve(cwd, arg)
		});

		loadArbitraryModules();
	}
	else {
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

		loadModule(dir);
		loadDependencies(dir);
		loadArbitraryModules();
	}

	// initialize the repl session with a message about what is being loaded
	console.log(treeify.asTree(requireList.reduce(function (a, b) {
		a.global[b.name] = b.version ? b.packageName+'@'+b.version : b.packageName;

		return a;
	}, {global: {}}), true));

	console.log('cwd:', process.cwd());

	var session = repl.start('> ');
	requireList.forEach(function(module) {
		session.context[module.name] = require(module.path);
	});
}


// helper functions ------------------------------------------------

// normalizeName should translate spaces and dashes into camelCased
// strings, unless it is a snake_cased string.
function normalizeName(input) {
	if (input === 'case') {
		return 'Case';
	}
	return Case.of(input) === 'snake' ? input : Case.camel(input);
}

function hasPackageJson(dir) {
	var packageJson = path.join(dir, 'package.json');
	return fs.existsSync(packageJson) && fs.statSync(packageJson).isFile();
}

function hasNodeModulesDir(dir) {
	var node_modules = path.join(dir, 'node_modules');
	return fs.existsSync(node_modules) && fs.statSync(node_modules).isDirectory();
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
function loadModule(packagePath) {
	if (! hasPackageJson(packagePath)) {
		return;
	}

	var package = require(path.join(packagePath, 'package.json'));
	package.main = package.main || 'index.js';

	// attach node module to session
	requireList.push({
		name: normalizeName(package.name),
		packageName: package.name,
		path: path.join(packagePath, package.main),
		version: package.version
	});
}


// Handle dependencies
function dependencyBlacklist(current) {
	return current !== '.bin';
}

function loadDependencies(packagePath) {
	if (! hasNodeModulesDir(packagePath)) {
		return;
	}

	var node_modules = path.join(packagePath, 'node_modules');

	fs.readdirSync(node_modules).filter(dependencyBlacklist).forEach(function(current) {
		loadModule(path.join(node_modules, current));
	});
}


// Load arbitrary commonjs modules
function filterArgs(arg) {
	return arg !== '_';
}

function loadArbitraryModules() {
	Object.keys(argv).filter(filterArgs).forEach(function(current) {
		var scriptPath = path.resolve(process.cwd(), argv[current]);
		requireList.push({
			name: normalizeName(current),
			packageName: scriptPath,
			path: scriptPath
		});
	});
}
