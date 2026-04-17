const axios = require('axios');
const https = require('https');

const agent = new https.Agent({
    ciphers: [
        "TLS_CHACHA20_POLY1305_SHA256",
        "TLS_AES_128_GCM_SHA256",
        "TLS_AES_256_GCM_SHA384",
        "ECDHE-ECDSA-CHACHA20-POLY1305"
    ].join(':'),
    honorCipherOrder: true,
    minVersion: 'TLSv1.2'
});

async function run() {
    try {
        const defaultHeaders = {
            'User-Agent': 'RiotClient/94.0.0.5283451.4785415 rso-auth (Windows;10;;Professional, x64)',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9'
        };

        const postData = {
            client_id: 'riot-client',
            nonce: "1",
            redirect_uri: 'http://localhost/redirect',
            response_type: 'token id_token'
        };

        const postResponse = await axios.post('https://auth.riotgames.com/api/v1/authorization', postData, {
            headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
            httpsAgent: agent,
            validateStatus: () => true
        });

        console.log("POST STATUS:", postResponse.status);
        console.log("POST Cookies:", postResponse.headers['set-cookie']);

        const cookies = postResponse.headers['set-cookie'] || [];
        const putData = {
            type: 'auth',
            username: "dummyuser123_456_789",
            password: "DummyPassword_123!",
            remember: true
        };

        const putResponse = await axios.put('https://auth.riotgames.com/api/v1/authorization', putData, {
            headers: {
                ...defaultHeaders,
                'Cookie': cookies.map(c => c.split(';')[0]).join('; '),
                'Content-Type': 'application/json'
            },
            httpsAgent: agent,
            validateStatus: () => true
        });

        console.log("PUT STATUS:", putResponse.status);
        console.log("PUT DATA:", JSON.stringify(putResponse.data));

    } catch (e) {
        console.log(e.message);
    }
}
run();
