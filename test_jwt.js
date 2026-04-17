const axios = require('axios');

// Fresh token from latest login - copy the access_token from login URL here
const accessToken = 'PASTE_YOUR_FRESH_ACCESS_TOKEN_HERE';

// Decode it to see payload
const parts = accessToken.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
console.log('JWT Payload:', JSON.stringify(payload, null, 2));
console.log('Region dat.c:', payload.dat ? payload.dat.c : 'NOT FOUND');
console.log('PUUID sub:', payload.sub);
