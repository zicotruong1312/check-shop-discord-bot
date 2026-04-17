const axios = require('axios');
const https = require('https');

const accessToken = 'eyJraWQiOiJyc28tcHJvZC0yMDI0LTExIiwiYWxnIjoiUlMyNTYifQ.eyJwcCI6eyJjIjoiYXMifSwic3ViIjoiMDRmMzU4ODEtNjcxMS01OTJkLTg3ZDEtNGM3NTFkM2U3OTMwIiwic2NwIjpbXSwiYWNyIjoidXJuOnJpb3Q6YnJvbnplIiwiZGF0Ijp7ImMiOiJhczEiLCJsaWQiOiJDa0ZqWTBhNWhpSGtUMzl0eUNaTVFBIn0sImFtciI6WyJwYXNzd29yZCJdLCJpc3MiOiJodHRwczovL2F1dGgucmlvdGdhbWVzLmNvbSIsInBsdCI6eyJkZXYiOiJ1bmtub3duIiwiaWQiOiJ3ZWIifSwiZXhwIjoxNzc2MzU0MDU4LCJpYXQiOjE3NzYzNTA0NTgsImp0aSI6IjNKOVBWclRNVTlZIiwiY2lkIjoicGxheS12YWxvcmFudC13ZWItcHJvZCJ9.O2Zrkkc9i5ROKpirk2MONLx9FaI51LONZeDLedPYDCrcKd5HXmP-TfTx-EkHtg8zXXkv1BJObom30dxaRLW6W2OHSwaTWl3xyGbCEsHycb3j7SHNr1bv-QQ-NEdWTkAQ2EJGUTP0BWAtO2fsgRWHRnkOHke_ZGeIYZDEYonZ7VZOC7HIPYzT5CagHIo4VjA-aA_6DDZw4d3CFclIaRpdezgkYu29RuejYFNs7iRsF3RnlluUDXUYnjLwa6_jrkNAEA4SXOp-j5qHTh8QR_TKWefxZR1Q6LGGADud75lpG9gYK-sI8bngN7LvHZ8N6zy5OIoGGOa_mRjuzQ4_kNEOWg';

const defaultHeaders = {
    'User-Agent': 'RiotClient/65.0.4.5270305.4789642 rso-auth (Windows; 10;;Professional, x64)',
    'Accept': 'application/json',
    'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
    'X-Riot-ClientVersion': 'release-09.00-shipping-1-2679261'
};

const agent = new https.Agent({
    ciphers: [
        "TLS_CHACHA20_POLY1305_SHA256",
        "TLS_AES_128_GCM_SHA256",
        "TLS_AES_256_GCM_SHA384",
        "ECDHE-ECDSA-CHACHA20-POLY1305"
    ].join(':')
});

async function test() {
    try {
        console.log("Fetching entitlements with headers...");
        const response = await axios.post('https://entitlements.auth.riotgames.com/api/token/v1', {}, {
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            httpsAgent: agent
        });
        console.log("Entitlements OK:", response.data);
    } catch (e) {
        console.log("Entitlements Error:", e.response ? e.response.status : e.message);
    }
}

test();
