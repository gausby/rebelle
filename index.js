#!/usr/bin/env node

/*global process */
var argv = require('minimist')(process.argv.slice(2));
var path = require('path');
var repl = require('repl');

var session = repl.start('> ');
var cwd = process.cwd();

function filterArgs(arg) { return arg !== '_'; }

var modules = Object.keys(argv).filter(filterArgs);

if (modules.length > 0) {
	// try to load in the given modules
	modules.forEach(function(current) {
		session.context[current] = require(path.join(cwd, argv[current]));
	});
}
else {
	// try to auto detect the current module from the package.json
	// and initialize the session using the name of the package and
	// the packages start point.
	var package = require('./package.json');

	if (package.name && package.main) {
		session.context[package.name] = require(path.join(cwd, package.main));
	}
	else {
		// fail in a informative manner
		process.exit(0);
	}
}
