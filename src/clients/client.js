'use strict';

var Client = function(distro, guid, machine) {
  this.distro = distro;
  this.guid = guid;
  this.machine = machine;
};

module.exports = Client;
