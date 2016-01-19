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
   * @param {String}   uuid VBox id string of the VM.
   * @param {String}   name VBox name of the VM.
   * @param {Object}   car  Control and Report object, stream, dunno yet...
   * @param {Bool}     save Save VM data to config.json if true.
   * @param {Function} cb   You guess! Hint: It's not chicken burger.
   */
  addVM: function(uuid, name, car, save, cb) {
    if (!uuid || uuid === '' || !name || name === '') {
      return cb(new Error('EMISSARG'));
    }
    for (var i = 0; i <= 2; i++) {
      if (void 0 === VM.machines[i]) {
        VM.machines[i] = new Machine(uuid, name, car);
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

  /**
   * Delete a VirtualBox VM from the service.
   * @param  {Number}   id Id in module:vm~machines
   * @param  {Function} cb
   */
  delVM: function(by, cb) {
    var machineID = VM._getMachineID(VM._getMachine(by));
    VM.machines[machineID] = void 0;
    cb(null);
  },

  /**
   * Start a VirtualBox VM.
   * @param  {Number}   id Id in the VM pool.
   * @param  {module:vm.vboxCb} cb
   */
  startVM: function(by, cb) {
    var machine = VM._getMachine(by);
    vbox.start(machine.uuid, function(err) {
      machine.car._ee.on('init', function(err, socket) {
        if (err) {
          return cb(err);
        }
        socket.write(machine.car.message('cmd', 'reqvnc', null));
      });
      cb(err, (!err) ? machine : void 0);
    });
  },

  /**
   * Send acpi shutdown signal to VM.
   * @param  {Number}   id Id in the VM pool.
   * @param  {module:vm.vboxCb} cb
   */
  shutdownVM: function(by, cb) {
    var machine = VM._getMachine(by);
    vbox.acpipowerbutton(machine.uuid, cb);
  },

  getMachineByName: function(name) {
    return VM._getMachine({ name: name });
  },
  getMachineByUUID: function(uuid) {
    return VM._getMachine({ uuid: uuid });
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
    for (var i = 0; i <= VM.machines.length - 1; i++) {
      if (VM.machines[i][key] === by[key]) {
        return VM.machines[i];
      }
    }
    return null;
  },

  _isUUID: function(val) {
    return (/.{8}-.{4}-.{4}-.{4}-.{12}/.exec(val) !== null);
  },

  _getMachineID: function(machine) {
    return VM.machines.filter(function(val) {
      return val.uuid === machine.uuid;
    });
  }
};

module.exports = VM;
