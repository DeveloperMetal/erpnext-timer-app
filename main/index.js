require = require('esm')(module)
require('electron').app.on('ready', () => require('./main.js'))
