'use strict';

var childProc = require('child_process');

var VNC = function() {
  this._config = require('nconf').get('VNC');
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
    this._config.port,
    '--token-plugin', 'ReadOnlyTokenFile',
    '--token-source', this._config.tokenDir,
    '--log-file', this._config.logFile,'--daemon'
  ];
  this.startProxy();
};

VNC.prototype.startProxy = function() {
  var self = this;
  this.isRunning(true, function(running, pid) {
    if (!running) {
      console.log('Starting WebSockify VNC proxy');
      self._proxyProc = childProc.spawn('./websockify/run', self._websockifyArgs);
      // websockify writes all messages to stderr; filter real errors
      self._proxyProc.stderr.on('data', function(data) {
        if (data.toString().indexOf('[Errno') > -1) {
          console.log('Error in websockify:');
          console.log(data.toString());
        }
      });
      self._proxyProc.on('close', function(code) {
        if (code === 0) {
          return console.log('VNC proxy running at :' + self._websockifyArgs[0]);
        }
        console.log('Proxy exited with code: ' + code);
      });
    }
  });
};

VNC.prototype.killProxy = function(pid, cb) {
  childProc.execFile('kill', [pid], function(err) {
    if (err) {
      return cb(err);
    }
    return cb(false);
  });
};

VNC.prototype.isRunning = function(kill, cb) {
  var self = this;
  console.log('looking for WebSockify');
  childProc.execFile('pgrep', ['websockify', '-f'], function(err, pid) {
    if (err) {
      return cb(false);
    }
    pid = pid.toString().trim();
    if (pid && kill) {
      console.log('running with pid ' + pid + ' - KILL REQUESTED...');
      return self.killProxy(pid, cb);
    }
    console.log('running at ' + pid);
    return cb(true, pid);
  });
};

module.exports = VNC;
