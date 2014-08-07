# Rebelle

A small tool that starts a repl session with a given list of modules loaded. Use this to play around with a given node module in a read-eval-print-loop.

Example:

```sh
$ rebelle --myModule lib/myModule.js
> myModule
[function]
>
```

This is essentially the same as opening a repl using `node` and writing `myModule = require('./lib/myModule')`—one could argue that this is a tad more convenient, though (some would perhaps argue the opposite, and very passionately).

An added benefit is that it will attempt to load the current node module if `rebelle` is executed within the folder structure of a node module. Also, if there is a `node_modules` folder in the current directory it will attempt to load them in and assign them to their package names.

Oh yeah, alpha software. Pull requests are welcome.


## Installation
Install it using `npm install rebelle -g`. A command line tool called `rebelle` should be available upon installation. Remove it again using `npm uninstall rebelle -g`.


## License
The MIT License (MIT)

Copyright (c) 2014 Martin Gausby

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
