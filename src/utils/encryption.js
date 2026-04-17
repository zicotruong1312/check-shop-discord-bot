const crypto = require('crypto');
require('dotenv').config();

const algorithm = 'aes-256-cbc';
const keyString = process.env.ENCRYPTION_KEY;

// Ensure key is exactly 32 bytes
let key;
if (keyString) {
    if (keyString.length === 32) {
        key = Buffer.from(keyString, 'utf-8');
    } else {
        key = Buffer.from(crypto.createHash('sha256').update(String(keyString)).digest('base64').substring(0, 32), 'utf-8');
    }
} else {
    // Fallback for development if env is not set
    key = crypto.randomBytes(32);
    console.warn("WARNING: using random generated key for ENCRYPTION_KEY. Sessions will become invalid after restart!");
}

function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

function decrypt(text, ivHex) {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(Buffer.from(text, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = { encrypt, decrypt };
