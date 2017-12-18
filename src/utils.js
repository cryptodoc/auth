const Error3 = require('error3');

function keyFromBuffer(buffer) {
    if (buffer.length !== 64) {
        throw new Error3('buffer_length', {
            expect: 64,
            actual: buffer.length,
        });
    }

    return `0x${buffer.toString('hex')}`;
}

exports.keyFromBuffer = keyFromBuffer;
