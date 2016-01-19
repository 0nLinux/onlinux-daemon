'use strict';

var childProc = require('child_process');

var VNC = {
  _config: require('nconf').get('VNC'),
  /**
   * WebSockify proxy process.
   * @type {ChildProcess}
   */
  _proxyProc: null,
  /**
   * Argument strings for WebSockify.
   * @type {Array}
   */
  _websockifyArgs: [],

  startProxy: function(cb) {
    VNC._websockifyArgs = [
      VNC._config.port,
      '--token-plugin', 'ReadOnlyTokenFile',
      '--token-source', VNC._config.tokenDir,
      '--log-file', VNC._config.logFile, '--daemon'
    ];
    VNC.isRunning(true, function(running, pid) {
      if (!running) {
        console.log('Starting VNC proxy (WebSockify)');
        VNC._proxyProc = childProc.spawn('./websockify/run', VNC._websockifyArgs);
        // websockify writes all messages to stderr; filter real errors
        VNC._proxyProc.stderr.on('data', function(data) {
          if (data.toString().indexOf('[Errno') > -1) {
            console.log(data.toString());
            return cb(new Error('Error in websockify'));
          }
        });
        VNC._proxyProc.on('close', function(code) {
          if (code === 0) {
            console.log('VNC proxy running at :' + VNC._websockifyArgs[0]);
            return cb(null);
          }
          return cb(new Error('VNC Proxy exited with code: ' + code));
        });
      }
    });
  },

  killProxy: function(pid, cb) {
    childProc.execFile('kill', [pid], function(err) {
      if (err) {
        return cb(err);
      }
      return cb(false);
    });
  },

  isRunning: function(kill, cb) {
    console.log('looking for WebSockify');
    childProc.execFile('pgrep', ['websockify', '-f'], function(err, pid) {
      if (err) {
        return cb(false);
      }
      pid = pid.toString().trim();
      if (pid && kill) {
        console.log('WebSockify running with pid ' + pid + ' - KILL REQUESTED...');
        return VNC.killProxy(pid, cb);
      }
      console.log('WebSockify running at ' + pid);
      return cb(true, pid);
    });
  }
};

module.exports = VNC;
