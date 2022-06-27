/* global suite, test */
require('../../../../../networked-aframe-forked/src/NafIndex');
var NafInterface = require('../../../../../networked-aframe-forked/src/NafInterface');

suite('NafInterface', function() {

  suite('notImplemented', function() {

    test('runs', function() {
      var obj = new NafInterface();
      obj.notImplemented();
    });
  });
});
