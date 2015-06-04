'use strict';

var assert = require('assert');
var worker = require('../lib/mobile_worker.js');
var child_process = require('child_process');
var fs = require('fs');
var _unique = worker._unique;
var _exist = worker._exist;
var _insert = worker._insert;
var _delete = worker._delete;
var _update = worker._update;

describe('_unique', function () {
  it('non-unique numbers should get an error', function (done) {
    var nums = [];
    for (var i = 0; i < 8000; i++) {
      nums.push(i);
    }
    for (var i = 0; i < 30; i++) {
      nums.push(Math.floor(Math.random()*8000));
    }
    _unique(nums, function (err, msg, mers) {
      assert(msg);
      assert.equal(mers.length, 8000);
      done();
    });
  });
});

describe('_exist', function () {
  var db;
  beforeEach(function (done) {
    db = require('../lib/mobile_db.js');
    db.on('open', done);
  });
  afterEach(function (done) {
    db.close(function () {
      child_process.exec('rm -R ' + __dirname + '/fixtures/mobile_db', function () {
        fs.realpath(__dirname + '/../lib/mobile_db.js', function (err, path) {
          delete require.cache[path];
          done();
        });
      });
    });
  });
  it('existed records should give a feedback', function (done) {
    var actions = [];
    var value = JSON.stringify({ order: null, name: null, gender: null });
    for (var i = 0; i < 8000; i++) {
      actions.push({ type: 'put', key: i, value: value });
    }
    db.batch(actions, function (err) {
      if (err) {
        return done(err);
      }
      _exist(db, [500, 10000, 20000, 600], function (err, msg, fils) {
        assert(msg);
        assert.equal(fils.length, 2);
        done();
      });
    });
  });
});

describe('_insert', function () {
  var db;
  beforeEach(function (done) {
    db = require('../lib/mobile_db.js');
    db.on('open', done);
  });
  afterEach(function (done) {
    db.close(function () {
      child_process.exec('rm -R ' + __dirname + '/fixtures/mobile_db', function () {
        fs.realpath(__dirname + '/../lib/mobile_db.js', function (err, path) {
          delete require.cache[path];
          done();
        });
      });
    });
  });
  it('numbers should be inserted into database successfully', function (done) {
    var nums = [];
    for (var i = 0; i < 8000; i++) {
      nums.push(i);
    }
    var batch = db.batch();
    for (var i = 0; i < 10; i++) {
      nums.push(Math.floor(Math.random() * 8000));
      batch.put(Math.floor(Math.random() * 8000));
    }
    batch.write(function () {
      _insert(db, nums, function (err, msg) {
        assert(!err);
        assert(msg);
        done();
      });
    });
  });
});

describe('_delete', function () {
  var db;
  beforeEach(function (done) {
    db = require('../lib/mobile_db.js');
    db.on('open', done);
  });
  afterEach(function (done) {
    db.close(function () {
      child_process.exec('rm -R ' + __dirname + '/fixtures/mobile_db', function () {
        fs.realpath(__dirname + '/../lib/mobile_db.js', function (err, path) {
          delete require.cache[path];
          done();
        });
      });
    });
  });
  it('deletion should be performed', function (done) {
    var actions = [];
    for (var i = 0; i < 8000; i++) {
      actions.push({ type: 'put', key: i, value: { foo: 'bar' }});
    }
    db.batch(actions, function () {
      db.get(200, function (err, value) {
        assert.equal(value.foo, 'bar');
        _delete(db, [ 200, 300, 400, 500 ], function () {
          db.get(200, function (err) {
            assert.equal(err.type, 'NotFoundError');
            done();
          });
        });
      });
    });
  });
});

describe('_update', function () {
  var db;
  beforeEach(function (done) {
    db = require('../lib/mobile_db.js');
    db.on('open', done);
  });
  afterEach(function (done) {
    db.close(function () {
      child_process.exec('rm -R ' + __dirname + '/fixtures/mobile_db', function () {
        fs.realpath(__dirname + '/../lib/mobile_db.js', function (err, path) {
          delete require.cache[path];
          done();
        });
      });
    });
  });
  it('record should be updated successfully', function (done) {
    var batch = db.batch();
    for (var i = 1; i < 40; i++) {
      batch.put(Math.floor(Math.random() * 8000), { empty: true });
    }
    batch.write(function () {
      _update(db, { order: 1234, name: 'coolwust' }, function (err, num) {
        assert(!err);
        db.get(num, function (err, value) {
          assert.equal(value.order, 1234);
          assert.equal(value.empty, false);
          done();
        });
      });
    });
  });
  it('no avaiable number should emit an error', function (done) {
    db.put(123, { empty: false }, function () {
      _update(db, { order: 1234, name: 'coolwust' }, function (err) {
        assert(err.message);
        done();
      });
    });
  });
});
