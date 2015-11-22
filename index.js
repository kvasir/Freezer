<<<<<<< HEAD
'use strict'
var app = require('app');
var path = require('path');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');

let mainWindow = null;
let noConnectionWindow = null;

=======
'use strict';
const app = require('app');
const path = require('path');
const BrowserWindow = require('browser-window');

let mainWindow = null;
>>>>>>> master

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});


let ppapiFlashPath = null;
let ppapiFlashVersion = null;

// Specify flash path.
// On Windows, it might be /path/to/pepflashplayer.dll
// On OS X, /path/to/PepperFlashPlayer.plugin
// On Linux, /path/to/libpepflashplayer.so
if (process.platform	=== 'win32') {
	ppapiFlashPath = path.join(__dirname, 'pepper/win32/pepflashplayer.dll');
	ppapiFlashVersion = '19.0.0.226';
} else if (process.platform === 'linux') {
	ppapiFlashPath = path.join(__dirname, 'pepper/linux/libpepflashplayer.so');
} else if (process.platform === 'darwin') {
	ppapiFlashPath = path.join(__dirname, 'pepper/darwin/PepperFlashPlayer.plugin');
	ppapiFlashVersion = '19.0.0.226';
}

app.commandLine.appendSwitch('ppapi-flash-path', ppapiFlashPath);
app.commandLine.appendSwitch('ppapi-flash-version', ppapiFlashVersion);

app.on('ready', () => {
	mainWindow = new BrowserWindow({
		'width': 800,
		'height': 600,
		'web-preferences': {
			'plugins': true,
			'node-integration': false,
			'preload': path.join(__dirname, 'browser.js'),
		}
	});

<<<<<<< HEAD
	mainWindow.openDevTools({ showDevTools: false });
=======
	mainWindow.openDevTools({showDevTools: true});
>>>>>>> master
	mainWindow.loadUrl('http://www.deezer.com');
});

ipc.on('online-status-changed', function(event, status) {
	//What do we want to do when the user is offline?
  console.log(status);
});
