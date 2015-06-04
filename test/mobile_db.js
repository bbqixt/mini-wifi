'use strict';

var assert = require('assert');
var fs = require('fs');
var child_process = require('child_process');

describe('mobile_db', function () {
  var db;
  beforeEach(function () {
    db = require('../lib/mobile_db.js');
  });
  afterEach(function (done) {
    db.close(function () {
      child_process.exec('rm -Rf ' + __dirname + '/fixtures/mobile_db/', function (err) {
        fs.realpath(__dirname + '/../lib/mobile_db.js', function (err, path) {
          delete require.cache[path];
          done();
        });
      });
    });
  });
  it('database should be estabilished successfully', function (done) {
    assert(db);
    fs.readdir(__dirname + '/fixtures/mobile_db', function (err, files) {
      assert(files.length);
      done();
    });
  });
  it('insertion and deletion should be performed successfully', function (done) {
    db.put(123, { 'name': 'coolwust' }, function (err) {
      assert(!err);
      db.get(123, function (err, value) {
        assert(!err);
        assert.equal(value.name, 'coolwust');
        done();
      });
    });
  });
});
