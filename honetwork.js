'use strict'

var nconf = require('nconf');
var execFileSync = require('child_process').execFileSync;

var HostOnlyNetwork = function() {
  this.iface;
  this._config = nconf.get('HostOnlyNetwork');
  console.log('Setting up host only network...');
  this.setup();
};

// setup host-only networt adapter for VMs
HostOnlyNetwork.prototype.setup = function() {
  var iface = this.getInterface();
  console.log('Found host only interface: ' + iface);
  if (iface/* === this._config.iface*/) {
    console.log('Configuring ' + iface + ' to ' + this._config.ip);
    execFileSync('vboxmanage',
               ['hostonlyif', 'ipconfig',
                iface, '--ip', this._config.ip]);
    this.iface = iface;
  }
};

HostOnlyNetwork.prototype.getInterface = function() {
  var ifsResult = execFileSync('vboxmanage', ['list', 'hostonlyifs']).toString();
  return /(\w*?):\s*(.*)/.exec(ifsResult.split('\n')[0])[2];
};

module.exports = HostOnlyNetwork;
