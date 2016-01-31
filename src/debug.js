'usestrict';

var vm = require('./vm');

var Debug = {
  listMachines: function() {
    console.log('Running:');
    console.log(vm.getRunning());
    console.log('Running type:');
    console.log(vm.getRunning('debian'));
    console.log('All:');
    console.log(vm.getAll());
    console.log('All type:');
    console.log(vm.getAll('debian'));
    console.log('Available:');
    console.log(vm.getAvailable());
    console.log('Available type:');
    console.log(vm.getAvailable('debian'));
  }
};

module.exports = Debug;
