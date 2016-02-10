'use strict';
/**
 * OnLinux VM pool.
 * @module vm
 */

var vbox = require('virtualbox');
var nconf = require('nconf');
var Machine = require('./vm/machine');

var VM = {
  /**
   * OnLinux VM pool.
   * @type {Array.<Object>}
   */
  machines: [],
  /**
   * Callback for vboxmanage commands.
   *
   * @callback module:vm.vboxCb
   * @param {?Object} err Possible error reported by VirtualBox.
   */

  /**
   * Add a VirtualBox VM to the service.
   * @param {String}    uuid VBox id string of the VM
   * @param {String}    name VBox name of the VM
   * @param {String}    type VM type, e.g. distribution
   * @param {Object}    car  Control and Report object
   * @param {Bool}      save Save VM data to config.json if true
   * @param {module:vm.vboxCb} cb
   */
  addVM: function(uuid, name, type, car, save, cb) {
    if (!uuid || uuid === '' || !name || name === '' || !type || type === '') {
      return cb(new Error('EMISSARG'));
    }
    for (var i = 0; i <= 2; i++) {
      if (void 0 === VM.machines[i]) {
        VM.machines[i] = new Machine(uuid, name, type, car);
        if (save) {
          nconf.set('machines', VM.machines);
          nconf.save(function(err) {
            if (err) {
              return cb(err);
            }
          });
        }
        cb(null, VM.machines[i]);
        break;
      } else if (VM.machines[i].uuid === uuid || VM.machines[i].name === name) {
        return cb(new Error('EEXISTS'));
      }
    }
  },

  delVM: function(uuid, cb) {
    var mIndex = VM._getMachineIndex(uuid);
    if (VM.machines[mIndex].isRunning) {
      VM.shutdownVM(VM.machines[mIndex], function(err) {
        if (err) {
          cb(err);
        }
        VM.machines.splice(mIndex, 1);
        cb(null);
      });
    } else {
      VM.machines.splice(mIndex, 1);
      cb(null);
    }
  },

  startVM: function(machine, cb) {
    vbox.start(machine.uuid, function(err) {
      if (err) {
        return cb(err);
      }
      machine.isRunning = true;
      machine.car._ee.on('init', function(err, socket) {
        if (err) {
          return console.log(err);
        }
        socket.write(machine.car.message('cmd', 'reqvnc', null));
      });
      cb(null, machine);
    });
  },

  shutdownVM: function(machine, cb) {
    vbox.acpipowerbutton(machine.uuid, function(err) {
      if (err) {
        return cb(err);
      }
      machine.isRunning = false;
      cb();
    });
  },

  getRunning: function(type) {
    return VM.machines.filter(function(machine) {
      if (void 0 !== type && machine.type !== type) {
        return false;
      }
      return machine.isRunning;
    });
  },

  getAvailable: function(type) {
    return VM.machines.filter(function(machine) {
      if (void 0 !== type && machine.type !== type) {
        return false;
      }
      return !machine.isRunning;
    });
  },

  getAll: function(type) {
    return VM.machines.filter(function(machine) {
      return (void 0 === type || machine.type === type);
    });
  },

  _getMachine: function(by) {
    if (typeof by === 'string') {
      if (VM._isUUID(by)) {
        by = {uuid: by};
      } else {
        by = {name: by};
      }
    }
    var key = Object.keys(by)[0];
    return VM.machines.filter(function(machine) {
      return by[key] === machine[key];
    })[0] || null;
  },

  _isUUID: function(val) {
    return (/.{8}-.{4}-.{4}-.{4}-.{12}/.exec(val) !== null);
  },

  _getMachineIndex: function(machine) {
    if (typeof machine === 'string') {
      machine = VM._getMachine(machine);
    }
    return VM.machines.indexOf(machine);
  }
};

module.exports = VM;
