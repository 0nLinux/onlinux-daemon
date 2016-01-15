'use strict'

var nconf = require('nconf');
var execFileSync = require('child_process').execFileSync;

var HostOnlyNetwork = function() {
  this.iface;
  this.cfg = nconf.get('HostOnlyNetwork');
  this.setup();
};

// setup host-only networt adapter for VMs
HostOnlyNetwork.prototype.setup = function() {
  var iface = this.getInterface();
  if (iface) {
    execFileSync('vboxmanage',
               ['hostonlyif', 'ipconfig',
                iface, '--ip', this.cfg.ip]);
    this.iface = iface;
  }
};

HostOnlyNetwork.prototype.getInterface = function() {
  var ifsResult = execFileSync('vboxmanage', ['list', 'hostonlyifs']).toString();
  var ifsLines = ifsResult.split('\n');
  var lineRx = /(\w*?):\s*(.*)/;
  var m;
  console.log(ifsLines);
  for (var i = ifsLines.length - 1; i >= 0; i--) {
    if ((m = lineRx.exec(ifsLines[i])) && m[1] === 'Name') {
      return m[2];
    }
  }
};

module.exports = HostOnlyNetwork;
