import hex2Bin from '../src/hex-to-bin';
import { expect } from 'chai';

const hexMap = [
  ['0123456789abcdef', '0000000100100011010001010110011110001001101010111100110111101111'],
  ['0123456789ABCDEF', '0000000100100011010001010110011110001001101010111100110111101111'],
];

describe('hexToBin', () => {
  it('converts a hex to a binay with small letters', () => {
    const [hex, bin] = hexMap[0];
    expect(hex2Bin(hex)).is.equal(bin);
  });

  it('converts a hex to a binay with capital letters', () => {
    const [hex, bin] = hexMap[1];
    expect(hex2Bin(hex)).is.equal(bin);
  });
});
