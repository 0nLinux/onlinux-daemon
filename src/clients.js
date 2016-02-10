'use strict';

var http = require('http');
var vm = require('./vm');
var Client = require('./clients/client');

var Clients = {
  _server: null,
  _ee: new (require('events').EventEmitter)(),
  _clients: [],

  startServer: function(cb) {
    console.log('Starting HTTP Server listening for clients requests.');
    Clients._server = http.createServer(Clients.handleRequest);
    Clients._server.listen('1215', function(err) {
      if (err) {
        if (err.message === 'EACCES') {
          console.log('Seems like you aren\'t allowed to bind to selected port.');
          console.log('Keep in mind, that, on Linux, unprivileged users (not root) can not bind ports below 1024!');
        }
        return cb(err);
      }
      console.log('Client Server listening on :1215');
      return cb(null);
    });
  },

  handleRequest: function(req, resp) {
    var m;
    var distro = '';
    var guid = '';
    // DEBUG
    resp.setHeader('Access-Control-Allow-Origin', '*');
    // !!!!!!!
    resp.setHeader('Content-Type', 'application/json');
    if ((m = /ichzvm\?(.*?)\&(.*)/.exec(req.url))) {
      // I Can Haz VM?
      distro = m[1].toLowerCase();
      guid = m[2];
      // DEBUG
      distro = 'debian';
      // !!!!!!!
      console.log(distro + ' VM requested by a client (guid: ' + guid + ').');
      var avail = vm.getAvailable(distro);
      if (avail.length > 0) {
        vm.startVM(avail[0], function(err, machine) {
          if (err) {
            return console.log(err);
          }
          Clients._clients.push(new Client(distro, guid, machine));
          return resp.end(JSON.stringify({ status: 'booting' }));
          // Clients._ee.emit('clientreq', guid, distro, resp);
        });
      } else {
        return resp.end(JSON.stringify({ status: 'error', err: 'ENOVMAV' }));
      }
    } else if ((m = /yda\?(.*)/.exec(req.url))) {
      guid = m[1];
      console.log(guid + ' is asking for VM status.');
      var client = Clients.getClient(guid);
      if (client.machine.vncToken) {
        return resp.end(JSON.stringify({
          status: 'token',
          token: client.machine.vncToken
        }));
      }
      return resp.end(JSON.stringify({ status: 'waiting' }));
      // Clients._ee.emit('askstatus', guid, resp);
    }
  },

  getClient: function(guid) {
    return Clients._clients.filter(function(client) {
      return client.guid === guid;
    })[0] || null;
  }
};

module.exports = Clients;
