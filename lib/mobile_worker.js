'use strict';

var db = require('./mobile_db.js');
var promisify = require('promisify');

function _unique(nums, done) {
  var dups = {};
  var seens = {};
  var mers = [];
  var len = nums.length;
  for (var i = 0; i < len; i++) {
    var num = nums[i];
    if (seens[num] === 1) {
      dups[num] ? dups[num]++ : (dups[num] = 2);
    } else {
      mers.push(num);
      seens[num] = 1;
    }
  }
  var msg = '';
  for (num in dups) {
    msg += ' - ' + num + ' x ' + dups[num] + '\n';
  }
  if (msg) msg = '[MERGED] duplicated numbers in input:\n' + msg;
  setImmediate(function () {
    done(null, msg, mers);
  });
}

var exis;
var fils;
var c = null;
function _exist(db, nums, done) {
  if (c === null) {
    c = nums.length - 1;
    exis = [];
    fils = [];
  }
  if (c < 0) {
    var msg = '';
    if (exis.length > 0) {
      msg = '[DISMISSED] existed/errored numbers in database:\n';
      exis.forEach(function (num) {
        msg += ' - ' + num + '\n';
      });
    }
    c = null;
    return done && done(null, msg, fils);
  }
  db.get(nums[c], function (err) {
    if (!err || err.type !== 'NotFoundError') {
      exis.push(nums[c]);
    } else {
      fils.push(nums[c]);
    }
    c--;
    setImmediate(function () {
      _exist(db, nums, done);
    });
  });
}

function _insert(db, nums, done) {

  var unique = promisify(_unique);
  var exist = promisify(_exist);
  var batch = promisify(db.batch);
  var msg = '';

  unique(nums)
    .then(function (args) {
      msg += args[0];
      return exist(db, args[1]);
    })
    .then(function (args) {
      msg += args[0];
      var actions = [];
      var value = { 
        empty: true
        //order: null,
        //passport: null,
        //name: null,
        //phone: null,
        //address: null,
        //start: null,
        //end: null
      };
      args[1].forEach(function (num) {
        actions.push({ type: 'put', key: num, value: value });
      });
      return batch.call(db, actions);
    })
    .then(function () {
      done(null, msg);
    })
    .catch(function (err) {
      done(err);
    });
}

function _delete(db, nums, done) {
  var actions = [];
  nums.forEach(function (num) {
    actions.push({ type: 'del', key: num });
  });
  db.batch(actions, done);
}

function _update(db, value, done) {

  var stream = db.createReadStream();

  function dataListener(entity) {
    if (!entity.value.empty) return;
    stream.pause();
    value.empty = false;
    db.put(entity.key, value, function (err) {
      done(err, entity.key);
    });
  }

  function endListener() {
    done(new Error('All mobile numbers are used'));
  }

  stream.on('data', dataListener);
  stream.once('end', endListener);
}

exports._unique = _unique;
exports._exist = _exist;
exports._insert = _insert;
exports._delete = _delete;
exports._update = _update;
