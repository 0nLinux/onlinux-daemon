'use strict';

var fs = require('fs');
var xxhash = require('xxhash');
var execFileSync = require('child_process').execFileSync;
var nconf = require('nconf');

var Machine = function(uuid, name, type, car) {
  var self = this;
  this.uuid = uuid;
  this.name = name;
  this.car = car || null;
  this.host = null;
  this.vncPort = 0;
  this.vncToken = null;
  this.tokenFile = null;
  this.isRunning = false;
  this.type = type;
  if (this.car) {
    this.car._ee.on('init', function(err, socket) {
      if (err) {
        return console.log(err);
      }
      self.host = socket.remoteAddress;
    });
    this.car._ee.on('vmready', function(port) {
      self.vncPort = port;
      self.vncToken = self.createToken();
    });
    this.car._ee.on('end', function(socket) {
      console.log('Guest ' + socket.remoteAddress + ' disconnected!');
      socket.end();
      self.destroyToken();
    });
  }
};

Machine.prototype.createToken = function() {
  var self = this;
  var seed = execFileSync('/bin/dd', ['if=/dev/urandom', 'bs=3', 'count=1', 'status=none']);
  var token = xxhash.hash(new Buffer(this.uuid), seed);
  this.tokenFile = nconf.get('VNC').tokenDir + token;
  fs.writeFile(this.tokenFile, token + ': ' + this.host + ':' + this.vncPort,
               function(err) {
                 if (err) {
                   console.log('Error while writing VNC token:');
                   return console.log(err);
                 }
                 console.log('Token for ' + self.host + ' written to ' + self.tokenFile);
               });
  return token;
};

Machine.prototype.destroyToken = function() {
  var self = this;
  fs.unlink(this.tokenFile, function() {
    var token = self.vncToken;
    self.vncToken = null;
    self.tokenFile = null;
    console.log('Token #' + token + ' destroyed');
  });
};

module.exports = Machine;
