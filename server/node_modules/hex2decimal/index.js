'use strict';

(function () {
  /*
   * @desc convert hex char to number
   * @param {String} 0-9a-fA-F
   * @return {Number}
   */
  function hexNumber(char) {
    var code = char.toLowerCase().charCodeAt(0);
    // 0-9
    if (code >= 48 && code <= 57) {
      return code - 48;
    }
    // a-f
    if (code >= 97 && code <= 102) {
      return code - 87;
    }
    return code;
  }
  /*
   * @desc add two hex string
   * @params {String} first hex string
   * @params {String} second hex string
   * @params {Number} scale
   * @return {String} added hex string
   */
  function add(sstr, dstr, scale) {
    var slen = sstr.length, dlen = dstr.length;
    var res = [];
    var carry = 0;
    var i = 0;
    var n;
    while(i < slen && i < dlen) {
      n = hexNumber(sstr[slen - i - 1]) + hexNumber(dstr[dlen - i - 1]) + carry;
      carry = Math.floor(n / scale);
      res.push(n % scale);
      i++;
    }
    while(i < slen) {
      n = hexNumber(sstr[slen - i - 1]) + carry;
      carry = Math.floor(n / scale);
      res.push(n % scale);
      i++;
    }
    while(i < dlen) {
      n = hexNumber(dstr[dlen - i - 1]) + carry;
      carry = Math.floor(n / scale);
      res.push(n % scale);
      i++;
    }
    while(carry > 0) {
      res.push(carry % scale);
      carry = Math.floor(carry / scale);
    }
    return res.reverse().join('');
  }
  /*
   * @desc multiply hex string
   * @params {String} hex string multiplicand
   * @params {Number} multiplier
   * @params {Number} scale
   * @return {String} multiplied hex string
   */
  function multiply(str, multiplier, scale) {
    var res = [];
    var carry = 0;
    var i = str.length;
    var n;
    while(--i >= 0) {
      n = hexNumber(str[i]) * multiplier + carry;
      carry = Math.floor(n / scale);
      res.push(n % scale);
    }
    while(carry > 0) {
      res.push(carry % scale);
      carry = Math.floor(carry / scale);
    }
    return res.reverse().join('');
  }
  /*
   * @main
   * @desc convert hex to decimal
   * @params {String} hex string
   * @params {Number} scale
   * @return {String} decimal string
   */
  function hex2decimal(hex, scale) {
    if (typeof Buffer !== 'undefined' && hex instanceof Buffer) {
      hex = hex.toString('hex');
    }
    if (typeof hex !== 'string') {
      hex = String(hex);
    }
    if (!(/^[0-9a-fA-F]+$/.test(hex))) {
      return hex;
    }
    scale = scale || 10;
    var res = '0';
    var i = 0;
    while(i < hex.length) {
      var n = hex[hex.length - 1 - i];
      var j = i;
      while(j--) {
        n = multiply(n, 16, scale);
      }
      res = add(res, n, scale);
      i++;
    }
    return res;
  }
  /*
   * @export
   */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = hex2decimal;
  } else if ( typeof define === "function" && define.amd ) {
    define("hex2decimal", [], function () { return hex2decimal; })
  } else {
    window.hex2decimal = hex2decimal;
  }
})();