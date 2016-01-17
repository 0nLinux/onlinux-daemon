'use strict'

var http = require('http');
var util = require('util');

var Clients = function() {
  this._server;
  console.log('Starting HTTP Server listening for clients requests.')
  this.startServer();
};
util.inherits(Clients, require('events').EventEmitter);

Clients.prototype.startServer = function() {
  var self = this;
  this._server = http.createServer(function(req, resp) {
    console.log(req);
    if (req.url === '/canIhasaVM') {
      console.log('VM requested by a client.');
      self.emit('clientreq', resp);
    }
  });
  this._server.listen('1215', function(err) {
    if (err) {
      if (err.message === 'EACCES') {
        console.log('Seems like you aren\'t allowed to bind to selected port.');
        console.log('Keep in mind, that, on Linux, unprivileged users (not root) can not bind ports below 1024!');
      }
      return err;
    }
    console.log('Client Server listening on :87');
  });
};

module.exports = Clients;
