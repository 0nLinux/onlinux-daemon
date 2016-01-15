#!/usr/bin/node

'use strict';

var w = require('winston')
var nconf = require('nconf');
var fs = require('fs');
var rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

// read config
nconf.file({ file: './config.json' });


var car = require('./car');
var vm = require('./vm');
var honet = new (require('./honetwork'))();
var vnc = new (require('./vnc'))(9500);

rl.question('Press key to start...', function(evt) {
  vm.addVm('2483cf72-be50-4896-8a37-3ea8b33ef5a7', 'onlinux_debian', new car(), false, function(err, machine) {
    if (err) {
      return w.error(err);
    }
    vm.startVm({uuid: machine.uuid}, function(err) {
      if (err) {
        return w.error(err);
      }
      machine.car.on('listening', function(err, conCfg) {
        if (err) {
          return w.error(err);
        }
        console.warn('New CaR server listening @ ' + conCfg.host + ':' + conCfg.port);
      });
      machine.car.startServer();
      machine.car.on('init', function(err, socket) {
        if(err) {
          return w.error(err);
        }
        socket.write(machine.car.message('cmd', 'reqvnc', null));
      });
    });
  });
});



/*var obj = object.prototype._create({
  x: x,
  y: y
});*/
