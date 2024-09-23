export function hexToFloat32(hex) {
    // Ensure the hex string is of proper length (8 hex digits for 32 bits)
    if (hex.length !== 8) {
        throw new Error('Hexadecimal string must be exactly 8 characters long.');
    }

    // Convert hex string to a buffer
    const buffer = Buffer.alloc(4); // Create a buffer of 4 bytes (32 bits)
    for (let i = 0; i < 4; i++) {
        // Parse each byte from the hex string and write it into the buffer
        const byte = parseInt(hex.substring(2 * i, 2 * i + 2), 16);
        buffer[3 - i] = byte; // Fill buffer in little-endian order
    }

    // Use ieee754 to read the buffer as a float
    return ieee754.read(buffer, 0, true, 23, 4);
}

export function hexToBinary(hexString) {
    hexString = String(hexString);
    return hexString.split('')
        .map(hexDigit => parseInt(hexDigit, 16).toString(2).padStart(4, '0'))
        .join('');
}
