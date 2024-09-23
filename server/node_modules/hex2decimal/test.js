'use strict'

var assert = require('assert');
var hex2decimal = require('./index');

describe('hex2decimal', function() {
	it('should work with hex string', function(done) {
		var res = hex2decimal('7fffffffffffffff');
		assert.equal(res, '9223372036854775807');
		done();
	});
	it('should work with buffer', function(done) {
		var res = hex2decimal(new Buffer([0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]));
		assert.equal(res, '9223372036854775807');
		done();
	});
	it('shold work with hex to binary', function (done) {
		var res = hex2decimal('7fffffffffffffff', 2);
		assert.equal(res, '111111111111111111111111111111111111111111111111111111111111111');
		done();
	})
});
