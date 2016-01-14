#!/usr/bin/node

'use strict';

var w = require('winston');
var car = require('./car');
var vm = require('./vm');
var vnc = require('./vnc');
var nconf = require('nconf');
var rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

// read config
nconf.file({ file: './config.json' });

// init & start vnc proxy (websockify)
var v = new vnc(9500);

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
        console.log('server listening:');
        console.log(conCfg);
      })
      machine.car.startServer();
      machine.car.on('init', function(err, socket) {
        if(err) {
          return w.error(err);
        }
        socket.write(machine.car.message('cmd', 'reqvnc', null));
      });
    });
  });
  function writeToken(host, port) {

  }
});



/*var obj = object.prototype._create({
  x: x,
  y: y
});*/
