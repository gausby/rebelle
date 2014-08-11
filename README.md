# Rebelle

A small tool that starts a repl session with a given list of modules loaded. Use this to play around with a given node module in a read-eval-print-loop.

Example:

```sh
$ cd /tmp
$ npm install pursuit
$ rebelle
└─ global
   └─ pursuit: pursuit@0.3.1

cwd: /tmp/
> pursuit
[function]
```

As the example shows, it will attempt to load the modules found in the `node_modules` folder in the current directory. The loading strategy is as follows:

  1. if rebelle is started with a javascript file as the first argument (the file ends in `.js`), it will load this into the session and give it the basename of the file. `rebelle /tmp/hello.js` would result in a session with the content of `hello.js` loaded into `global.hello`.

  2. if the first argument is a `package.json` file, it will attempt to load this package into the session and give it the name of the package. The dependencies will also be loaded in and the current working directory will be set to the path of the package.

  3. if a folder is given as the first argument it will look for a `node_modules`-folder and load the packages within that folder into the session.

  4. if no argument is given it will traverse the file-system upwards untill it finds a folder with a `package.json`-file or a `node_modules`-folder, and follow *2* for the former and *3* for the latter.

Extra javascript or JSON-files can be required into the session by using double dash arguments.

```sh
$ rebelle /tmp/pursuit/package.json --hello /tmp/hello.js
└─ global
   ├─ pursuit: pursuit@0.3.1
   ├─ pursuitCore: pursuit-core@0.0.1
   ├─ pursuitDictionary: pursuit-dictionary@0.0.1
   └─ hello: /tmp/hello.js

cwd: /private/tmp/lodash/node_modules/pursuit
>
```

There is support for more than one file, so by all means: go nuts!

Oh yeah, alpha software. Pull requests are welcome.


## Installation
Install it using `npm install rebelle -g`. A command line tool called `rebelle` should be available upon installation. Remove it again using `npm uninstall rebelle -g`.


## License
The MIT License (MIT)

Copyright (c) 2014 Martin Gausby

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
