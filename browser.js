var ipc = require('ipc');
var updateOnlineStatus = function() {
	ipc.send('online-status-changed', navigator.onLine ? 'online' : 'offline');
};

window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline',  updateOnlineStatus);

updateOnlineStatus();
