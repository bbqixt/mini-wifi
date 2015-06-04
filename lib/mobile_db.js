'use strict';

var LevelUp = require('levelup');

var dir = __dirname 
        + (process.env.PRODUCTION === "1" ? '' : '/../test/fixtures') 
        + '/mobile_db';
var options = {
  keyEncoding: 'utf8',
  valueEncoding: 'json'
}
module.exports = new LevelUp(dir, options);
