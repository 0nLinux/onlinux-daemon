'use strict';
/**
 * OnLinux Command and Report.
 * @module car
 */

var net = require('net');
var w = require('winston');
var nconf = require('nconf');

var CaR = {
  _host: nconf.get('HostOnlyNetwork').ip,
  _port: 15121,
  _server: null,
  _ee: new (require('events').EventEmitter)(),
  startServer: function(cb) {
    CaR._server = net.createServer({
      allowHalfOpen: true
    });
    CaR._server.listen({
      host: CaR._host,
      port: CaR._port
    }, function() {
      CaR._ee.emit('listening', null, {
        host: CaR._server.address().address,
        port: CaR._server.address().port
      });
      return cb(null);
    });
    CaR._server.on('error', CaR.handleError);
    CaR._server.on('close', CaR.handleClose);
    CaR._server.on('connection', CaR.newConnection);
  },

  handleError: function(err) {
    w.error('CaR server error:');
    w.error(err);
  },

  handleClose: function() {
    w.warn('CaR server closed.');
  },

  newConnection: function(socket) {
    console.log('Guest VM connected from: ' + socket.remoteAddress);
    socket.on('end', function() {
      CaR._ee.emit('end', socket);
    });
    socket.on('data', function(data) {
      data = CaR.parseData(data.toString());
      if (data.type === 'status') {
        if (data.msg === 'init') {
          // CaR inside the VM is up and running, system still booting
          CaR._ee.emit('init', null, socket);
        } else if (data.msg === 'wait') {
          // VNC requested, but not up; presumably still booting
          console.log('Still waiting for VNC...');
        } else if (data.msg === 'goahead') {
          // VNC is up
          CaR._ee.emit('vmready', data.data.port);
        }
      } else if (data.type === 'report') {

      }
    });
    socket.write(CaR.message('status', 'hello', null));
  },

  message: function(type, msg, data) {
    return JSON.stringify({
      type: type,
      data: data,
      msg: msg
    });
  },

  parseData: function(data) {
    data = data.trim();
    try {
      return JSON.parse(data);
    } catch (err) {
      console.log(err);
    }
  }
};

module.exports = CaR;
