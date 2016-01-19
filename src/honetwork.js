'use strict';

var nconf = require('nconf');
var execFileSync = require('child_process').execFileSync;

var HostOnlyNetwork = {
  iface: null,
  _config: nconf.get('HostOnlyNetwork'),
  setup: function(cb) {
    try {
      var iface = HostOnlyNetwork.getInterface();
      console.log('Found host only interface: ' + iface);
      if (iface/* === HostOnlyNetwork._config.iface*/) {
        console.log('Configuring ' + iface + ' to ' + HostOnlyNetwork._config.ip);
        execFileSync('vboxmanage',
                   ['hostonlyif', 'ipconfig',
                    iface, '--ip', HostOnlyNetwork._config.ip]);
        HostOnlyNetwork.iface = iface;
        return cb(null);
      }
    } catch (err) {
      return cb(err);
    }
  },
  getInterface: function() {
    var ifsResult = execFileSync('vboxmanage', ['list', 'hostonlyifs']).toString();
    return /(\w*?):\s*(.*)/.exec(ifsResult.split('\n')[0])[2];
  }
};

module.exports = HostOnlyNetwork;
