import { Buffer } from 'buffer';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const buffer = require('buffer');

if (!buffer.SlowBuffer) {
    const mockSlowBuffer = function (size) {
        return Buffer.allocUnsafeSlow(size);
    };
    mockSlowBuffer.prototype = Buffer.prototype;

    // Inject into the buffer module so that other packages requiring it will see it
    buffer.SlowBuffer = mockSlowBuffer;
}

// Also set it on globalThis just in case
if (!globalThis.SlowBuffer) {
    globalThis.SlowBuffer = buffer.SlowBuffer;
}
