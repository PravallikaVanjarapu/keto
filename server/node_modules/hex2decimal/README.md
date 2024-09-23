# hex2decimal

## Description

Thanks for nonsupport of int64, big hex cann't display in js. 

Based on string, this package could convert big hex to decimal.

## Installation

```	
npm install hex2decimal
```

## Examples

```js	
var hex2decimal = require("hex2decimal");
hex2decimal('7fffffffffffffff'); // '9223372036854775807'
hex2decimal(new Buffer([0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])); // '9223372036854775807'

// binary
hex2decimal('7fffffffffffffff', 2); // '111111111111111111111111111111111111111111111111111111111111111'
```

## Tests

```
npm test
```
