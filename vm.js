'use strict';
/**
 * OnLinux VM pool.
 * @module vm
 */

var fs = require('fs');
var vbox = require('virtualbox');
var nconf = require('nconf');
var xxhash = require('xxhash');
var execFileSync = require('child_process').execFileSync;
/**
 * OnLinux VM pool.
 * @type {Array.<Object>}
 */
var machines = nconf.get('machines') || [];
/**
 * Callback for vboxmanage commands.
 *
 * @callback module:vm.vboxCb
 * @param {?Object} err Possible error reported by VirtualBox.
 */

function Machine(uuid, name, car, token) {
  var self = this;
  this.uuid = uuid;
  this.name = name;
  this.car = car || null;
  this.host = null;
  this.vncPort = 0;
  this.vncToken = token || null;
  this.tokenFile = null;
  if (this.car) {
    this.car.on('init', function(err, socket) {
      self.host = socket.remoteAddress;
    });
    this.car.on('vmready', function(port) {
      self.vncPort = port;
      self.vncToken = self.createToken();
    });
    this.car.on('end', function() {
      console.log('CaR disconnected!');
      self.destroyToken();
    })
  }
}
Machine.prototype.createToken = function() {
  var self = this;
  var seed = execFileSync('/bin/dd', ['if=/dev/urandom', 'bs=3', 'count=1', 'status=none']);
  var token = xxhash.hash(new Buffer(this.uuid), seed);
  this.tokenFile = process.cwd() + nconf.get('tokenDir') + token;
  fs.writeFile(this.tokenFile, token + ': ' + this.host + ':' + this.vncPort,
               function (err) {
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
    self.token = null;
    self.tokenFile = null;
    console.log('Token destroyed');
  });
};

/**
 * Add a VirtualBox VM to the service.
 * @param {String}   uuid VBox id string of the VM.
 * @param {String}   name VBox name of the VM.
 * @param {Object}   car  Control and Report object, stream, dunno yet...
 * @param {Bool}     save Save VM data to config.json if true.
 * @param {Function} cb   You guess! Hint: It's not chicken burger.
 */
function addVm(uuid, name, car, save, cb) {
  if (!uuid || uuid === '' || !name || name === '') {
    return cb(new Error('EMISSARG'));
  }
  for (var i = 0; i <= 2; i++) {
    if (void 0 === machines[i]) {
      machines[i] = new Machine(uuid, name, car);
      if (save) {
        nconf.set('machines', machines);
        nconf.save(function(err) {
          if (err) {
            return cb(err);
          }
        });
      }
      cb(null, machines[i]);
      break;
    } else if (machines[i].uuid === uuid || machines[i].name === name) {
      return cb(new Error('EEXISTS'));
    }
  }
}

/**
 * Delete a VirtualBox VM from the service.
 * @param  {Number}   id Id in module:vm~machines
 * @param  {Function} cb 
 */
function delVM(by, cb) {
  var id = getIdBy(by);
  machines[id] = void 0;
  cb(null);  
}

/**
 * Start a VirtualBox VM.
 * @param  {Number}   id Id in the VM pool.
 * @param  {module:vm.vboxCb} cb 
 */
function startVM(by, cb) {
  var id = getIdBy(by);
  vbox.start(machines[id].uuid, cb);
}

/**
 * Send acpi shutdown signal to VM.
 * @param  {Number}   id Id in the VM pool.
 * @param  {module:vm.vboxCb} cb
 */
function shutdownVm(by, cb) {
  var id = getIdBy(by);
  vbox.acpipowerbutton(machines[id].uuid, cb);
}

function getIdBy(by) {
  var filter = {
    uuid: function(uuid) {
      for (var i = 0; i <= machines.length - 1; i++) {
        if (machines[i].uuid === uuid) {
          return i;
        }
      }
      return -1;
    },
    name: function(name) {
      for (var i = 0; i <= machines.length - 1; i++) {
        if (machines[i].name === name) {
          return i;
        }
      }
      return -1;
    }
  };
  var key = Object.keys(by)[0];
  return filter[key](by[key]);
}

module.exports = {
  /** Add a VirtualBox VM to the service. */
  'addVm': addVm,
  /** Delete a VirtualBox VM from the service. */
  'delVm': delVM,
  /** Start a VirtualBox VM. */
  'startVm': startVM,
  /** Send acpi shutdown signal to VM. */
  'shutdownVm': shutdownVm
};
