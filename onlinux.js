#!/usr/bin/node

'use strict';

var w = require('winston');
var nconf = require('nconf');
var fs = require('fs');
var async = require('async');
var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);

// read config
nconf.file({ file: './config.json' });

// create tmp dir
if (!fs.existsSync(nconf.get('VNC').tokenDir)) {
  fs.mkdirSync(nconf.get('VNC').tokenDir);
}

var car = require('./src/car');
var vm = require('./src/vm');
var honet = require('./src/honetwork');
var vnc = require('./src/vnc');
var clients = require('./src/clients');

// debug shell
var debug = require('./src/debug');
rl.on('line', function(cmd) {
  switch (cmd) {
  case 'machines':
    debug.listMachines();
    break;
  case 'start':
    vm.startVM(vm._getMachine('2483cf72-be50-4896-8a37-3ea8b33ef5a7'), function(err) {
      if (err) {
        w.error(err);
      }
    });
    break;
  case 'stop':
    vm.shutdownVM(vm._getMachine('2483cf72-be50-4896-8a37-3ea8b33ef5a7'), function(err) {
      if (err) {
        w.error(err);
      }
    });
    break;
  case 'del':
    vm.delVM('2483cf72-be50-4896-8a37-3ea8b33ef5a7', function(err) {
      if (err) {
        w.error(err);
      }
    });
  }
});

var kdone = function() {
  vm.addVM('2483cf72-be50-4896-8a37-3ea8b33ef5a7', 'onlinux_debian', 'debian', car, false, function(err, machine) {
    if (err) {
      return w.error(err);
    }
    console.log(machine.name + ' (' + machine.uuid + ') added.');
    /* vm.delVM('2483cf72-be50-4896-8a37-3ea8b33ef5a7', function(err) {
      if (err) {
        return w.error(err);
      }
      w.log('DONE');
    });*/
  });
};

// spin up:
// 1. Setup VirtualBox "Host-Only Network" [honet]
// 2. Start CaR server [car]
// 3. Start VNC proxy (WebSockify) [vnc]
// 4. Start server for clients [client]
async.series([honet.setup, car.startServer,
              vnc.startProxy, clients.startServer, kdone],
              function(err) {
                if (err) {
                  console.log('STARTUP FAILED');
                  console.log(err);
                  process.exit(1);
                }
              });
rl.prompt();
