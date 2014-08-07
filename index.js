#!/usr/bin/env node

/*global process */
var argv = require('minimist')(process.argv.slice(2));
var path = require('path');
var fs = require('fs');
var repl = require('repl');

var session = repl.start('> ');
var cwd = process.cwd();

// attempt to find a package.json file by crawling up the file tree
// untill it find a folder with a file called "package.json"
function resolvePackageDir(cwd) {
	for (var dir = cwd.split(path.sep); dir.length; dir.pop()) {
		var current = path.sep + path.join.apply(this, dir, path.sep);

		if (fs.existsSync(path.join(current, 'package.json'))) {
			return current;
		}
	}

	return false;
}

// Include a module to the repl session
function loadModule(packagePath) {
	var packageFile = path.join(packagePath, 'package.json');

	if (! fs.existsSync(packageFile)) {
		return;
	}

	var package = require(path.join(packagePath, 'package.json'));
	package.main = package.main || 'index.js';

	// attach node module to session
	session.context[package.name] = require(path.join(packagePath, package.main));
}

// Handle dependencies
function dependencyBlacklist(current) {
	return current !== '.bin';
}

function loadDependencies(packagePath) {
	var node_modules = path.join(packagePath, 'node_modules');

	if (! fs.existsSync(node_modules)) {
		return;
	}

	fs.readdirSync(node_modules).filter(dependencyBlacklist).forEach(function(current) {
		loadModule(path.join(node_modules, current));
	});
}

// Load the current module and its dependencies
var dir = resolvePackageDir(cwd) || cwd;
if (dir) {
	loadModule(dir);
	loadDependencies(dir);
}

// Load arbitrary commonjs modules
function filterArgs(arg) { return arg !== '_'; }
Object.keys(argv).filter(filterArgs).forEach(function(current) {
	session.context[current] = require(path.join(cwd, argv[current]));
});
