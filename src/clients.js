'use strict';

var http = require('http');

var Clients = {
  _server: null,
  _ee: new (require('events').EventEmitter)(),

  startServer: function(cb) {
    console.log('Starting HTTP Server listening for clients requests.');
    Clients._server = http.createServer(function(req, resp) {
      var m;
      var distro = '';
      var guid = '';
      if ((m = /ichzvm\?(.*?)\&(.*)/.exec(req.url))) {
        console.log(m);
        // I Can Haz VM?
        distro = m[1].toLowerCase();
        guid = m[2];
        console.log(distro + ' VM requested by a client (guid: ' + guid + ').');
        Clients._ee.emit('clientreq', guid, distro, resp);
      } else if ((m = /yda\?(.*)/.exec(req.url))) {
        guid = m[1];
        console.log(guid + ' is asking for VM status.');
        Clients._ee.emit('askstatus', guid, resp);
      }
    });
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
  }
};

module.exports = Clients;
