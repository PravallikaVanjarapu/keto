# Hex to bin

A simple function that converts hexadecimal string to binary with typescript

## Installation

Using npm:

`npm install hex-to-bin -S`

Using yarn:

`yarn add hex-to-bin`

## Usage

```ts
import hex2Bin from 'hex-to-bin';
const hexString = '0123456789abcdef';

// 0000000100100011010001010110011110001001101010111100110111101111 
console.log(hex2Bin(hexString));
```

