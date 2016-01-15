'use strict';
/**
 * OnLinux Command and Report.
 * @module car
 */

var net = require('net');
var util = require('util');
var w = require('winston');
var nconf = require('nconf');

var lastPort = 15120; // OL# => 1512#

var Car = function(conf) {
  this._host = nconf.get('HostOnlyNetwork').ip;
  this._port = ++lastPort;
  this._server = null;
};
util.inherits(Car, require('events').EventEmitter);

Car.prototype.startServer = function() {
  var self = this;
  this._server = net.createServer();
  this._server.listen({
    host: this._host,
    port: this._port,
    exclusive: true
  }, function() {
    self.emit('listening', null, {
      host: self._server.address().address,
      port: self._server.address().port
    });
  });
  this._server.on('error', handleError);
  this._server.on('close', handleClose);
  this._server.on('connection', function(socket) {
    self.newConnection(socket, self);
  });
}

var handleError = function(err) {
  w.error('CaR server error:')
  w.error(err);
};

var handleClose = function() {
  w.warn('CaR server closed.');
};

Car.prototype.newConnection = function(socket, ctx) {
  console.log('client connected from: ' + socket.remoteAddress);
  socket.on('end', function() {
    ctx.emit('end');
  });
  socket.on('data', function(data) {
    data = parseData(data.toString());
    if (data.type === 'status') {
      if (data.msg === 'init') {
        // CaR inside the VM is up and running, system still booting
        ctx.emit('init', null, socket);
      } else if (data.msg === 'wait') {
        // VNC requested, but not up; presumably still booting
        console.log('Still waiting for VNC...');
      } else if (data.msg === 'goahead') {
        // VNC is up
        ctx.emit('vmready', data.data.port);
      }
    } else if (data.type === 'report') {

    }
  });
  socket.write(ctx.message('status', 'hello', null));
};

Car.prototype.message = function(type, msg, data) {
  return JSON.stringify({ 
    type: type,
    data: data,
    msg: msg
  });
};

function parseData(data) {
  data = data.trim();
  try {
    return JSON.parse(data); 
  } catch (err) {
    console.log(err);
  }
}

module.exports = Car;
