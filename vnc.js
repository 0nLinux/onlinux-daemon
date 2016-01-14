'use strict';

var spawn = require('child_process').spawn;

var VNC = function(port) {
  /**
   * Port clients connect to.
   * @type {Number}
   */
  this._port = port.toString();
  /**
   * Path to folder with generated token files.
   * @type {String}
   */
  this._tokenDir = process.cwd() + '/tokens/'; // needs check, websockify doesn't on startup
  /**
   * WebSockify proxy process.
   * @type {ChildProcess}
   */
  this._proxyProc = null;
  /**
   * Argument strings for WebSockify.
   * @type {Array}
   */
  this._websockifyArgs = [
    this._port,
    '--token-plugin', 'ReadOnlyTokenFile',
    '--token-source', this._tokenDir,
    '--log-file', process.cwd() + '/logs/websockify.log'/*,
    '--daemon'*/
  ];
  this.startProxy();
};

VNC.prototype.startProxy = function() {
  this._proxyProc = spawn('./websockify/run', this._websockifyArgs);
  // websockify writes all messages to stderr; filter real errors
  this._proxyProc.stderr.on('data', function(data) {
    if (data.toString().indexOf('[Errno') > -1) {
      console.log('Error in websockify:');
      console.log(data.toString());
    }
  });
  this._proxyProc.on('close', function(code) {
    console.log('Proxy exited with code: ' + code);
  });
};

module.exports = VNC;
