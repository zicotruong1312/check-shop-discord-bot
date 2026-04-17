/**
 * Test account-xp works but storefront doesn't — check if entitlements are empty causing issues
 */
const axios = require('axios');
const https = require('https');

const accessToken = 'eyJraWQiOiJyc28tcHJvZC0yMDI0LTExIiwiYWxnIjoiUlMyNTYifQ.eyJwcCI6eyJjIjoiYXMifSwic3ViIjoiMDRmMzU4ODEtNjcxMS01OTJkLTg3ZDEtNGM3NTFkM2U3OTMwIiwic2NwIjpbXSwiYWNyIjoidXJuOnJpb3Q6YnJvbnplIiwiZGF0Ijp7ImMiOiJhczEiLCJsaWQiOiJCVmtLbDhiNjJRY3VqX01ENGxHVm9RIn0sImFtciI6WyJwYXNzd29yZCJdLCJpc3MiOiJodHRwczovL2F1dGgucmlvdGdhbWVzLmNvbSIsInBsdCI6eyJkZXYiOiJ1bmtub3duIiwiaWQiOiJ3ZWIifSwiZXhwIjoxNzc2MzU1NTY4LCJpYXQiOjE3NzYzNTE5NjgsImp0aSI6InRMYzBLcUxwNVpNIiwiY2lkIjoicmlvdC1jbGllbnQifQ.ZVsCtykRMt9xULrfPAnj0JK25hhoKWvoL11njvVQ1-WXmTnX3BmJt5dnOrGk-Uz8aoTqVBHHlTf_AteBazCP36wakZUzsoH0ig3TER4C78Co6QeBTg4XdD8ootC5WltQKCfuI93Bbj5heXRvC0-o3bdFjpZnF-D11L8Bdaa755TDSeYxSEIXvbsTmJX2cphI41weNFQfDejbQnpkdMcS_UeBs8dVkb1fZmENU5BEHAfYC2qm9ZmiWKQ8T9Sg-X76yU2HSXextup-A43nfOHifhO5Ip7m3E49wadpudXUvjW7dKRoZ47bAQ4WNtqWs2Y5ymMuUANXY0qU4Tji_KOC0Q';
const puuid = '04f35881-6711-592d-87d1-4c751d3e7930';

const ciphers = ['ECDHE-ECDSA-CHACHA20-POLY1305','ECDHE-RSA-CHACHA20-POLY1305','ECDHE-ECDSA-AES128-GCM-SHA256','ECDHE-RSA-AES128-GCM-SHA256','ECDHE-ECDSA-AES256-GCM-SHA384','ECDHE-RSA-AES256-GCM-SHA384'].join(':');
const agent = new https.Agent({ ciphers, honorCipherOrder: true, minVersion: 'TLSv1.2' });

const clientVersion = 'release-12.06-shipping-19-4440219';
const base = {
    'Authorization': `Bearer ${accessToken}`,
    'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
    'X-Riot-ClientVersion': clientVersion,
    'User-Agent': 'ShooterGame/13 Windows/10.0.19043.1.256.64bit'
};

async function run() {
    const entRes = await axios.post('https://entitlements.auth.riotgames.com/api/token/v1', {}, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        httpsAgent: agent
    });
    const ent = entRes.data.entitlements_token;
    
    const headers = { ...base, 'X-Riot-Entitlements-JWT': ent };
    
    // Try store endpoint without entitlements first
    console.log('Test 1: Store v2 without entitlements...');
    try {
        const r = await axios.get(`https://pd.ap.a.pvp.net/store/v2/storefront/${puuid}`, {
            headers: base, httpsAgent: agent
        });
        console.log(`✅ ${r.status}`, Object.keys(r.data));
    } catch(e) {
        console.log(`❌ ${e.response?.status}: ${JSON.stringify(e.response?.data)}`);
    }

    // Try with full headers (with entitlements)
    console.log('\nTest 2: Store v2 with entitlements...');
    try {
        const r = await axios.get(`https://pd.ap.a.pvp.net/store/v2/storefront/${puuid}`, {
            headers, httpsAgent: agent
        });
        console.log(`✅ ${r.status}`, JSON.stringify(r.data, null, 2).substring(0, 500));
    } catch(e) {
        console.log(`❌ ${e.response?.status}: ${JSON.stringify(e.response?.data)}`);
    }
    
    // Try wallet — simpler endpoint
    console.log('\nTest 3: Store wallet...');
    try {
        const r = await axios.get(`https://pd.ap.a.pvp.net/store/v1/wallet/${puuid}`, {
            headers, httpsAgent: agent
        });
        console.log(`✅ Wallet: ${JSON.stringify(r.data)}`);
    } catch(e) {
        console.log(`❌ Wallet: ${e.response?.status}: ${JSON.stringify(e.response?.data)}`);
    }
}

run().catch(console.error);
