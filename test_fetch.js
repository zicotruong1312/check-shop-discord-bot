async function run() {
    try {
        const defaultHeaders = {
            'User-Agent': 'RiotClient/94.0.0.5283451.4785415 rso-auth (Windows;10;;Professional, x64)',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
            'X-Riot-ClientVersion': 'release-09.00-shipping-1-2679261'
        };

        const postData = {
            client_id: 'play-valorant-web-prod',
            nonce: 1,
            redirect_uri: 'https://playvalorant.com/opt_in',
            response_type: 'token id_token'
        };

        console.log("POSTing...");
        const postResp = await fetch('https://auth.riotgames.com/api/v1/authorization', {
            method: 'POST',
            headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });

        console.log("POST STATUS:", postResp.status);
        const cookiesRaw = postResp.headers.get('set-cookie');
        console.log("Cookies string:", cookiesRaw);

        // Fetch combines set-cookie headers into a single comma separated string
        // Need to parse it carefully or just pass it directly.
        // Actually for simplicity, just pass the raw cookie string since it works sometimes, or split by ', '.
        let cookieArr = [];
        if (cookiesRaw) {
            cookieArr = cookiesRaw.split(', ').map(c => c.split(';')[0]);
        }
        
        const loginData = {
            type: 'auth',
            username: "dummyuser123_456_789",
            password: "DummyPassword_123!",
            remember: true
        };

        console.log("PUTting...");
        const putResp = await fetch('https://auth.riotgames.com/api/v1/authorization', {
            method: 'PUT',
            headers: {
                ...defaultHeaders,
                'Cookie': cookieArr.join('; '),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        console.log("PUT STATUS:", putResp.status);
        console.log("PUT DATA:", await putResp.json());

    } catch (e) {
        console.log(e.message);
    }
}
run();
