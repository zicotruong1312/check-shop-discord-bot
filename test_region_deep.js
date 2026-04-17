/**
 * Deep debug: check what region this account actually belongs to
 * by probing multiple approaches
 */
const axios = require('axios');
const https = require('https');

const accessToken = 'eyJraWQiOiJyc28tcHJvZC0yMDI0LTExIiwiYWxnIjoiUlMyNTYifQ.eyJwcCI6eyJjIjoiYXMifSwic3ViIjoiMDRmMzU4ODEtNjcxMS01OTJkLTg3ZDEtNGM3NTFkM2U3OTMwIiwic2NwIjpbXSwiYWNyIjoidXJuOnJpb3Q6YnJvbnplIiwiZGF0Ijp7ImMiOiJhczEiLCJsaWQiOiJCVmtLbDhiNjJRY3VqX01ENGxHVm9RIn0sImFtciI6WyJwYXNzd29yZCJdLCJpc3MiOiJodHRwczovL2F1dGgucmlvdGdhbWVzLmNvbSIsInBsdCI6eyJkZXYiOiJ1bmtub3duIiwiaWQiOiJ3ZWIifSwiZXhwIjoxNzc2MzU1NTY4LCJpYXQiOjE3NzYzNTE5NjgsImp0aSI6InRMYzBLcUxwNVpNIiwiY2lkIjoicmlvdC1jbGllbnQifQ.ZVsCtykRMt9xULrfPAnj0JK25hhoKWvoL11njvVQ1-WXmTnX3BmJt5dnOrGk-Uz8aoTqVBHHlTf_AteBazCP36wakZUzsoH0ig3TER4C78Co6QeBTg4XdD8ootC5WltQKCfuI93Bbj5heXRvC0-o3bdFjpZnF-D11L8Bdaa755TDSeYxSEIXvbsTmJX2cphI41weNFQfDejbQnpkdMcS_UeBs8dVkb1fZmENU5BEHAfYC2qm9ZmiWKQ8T9Sg-X76yU2HSXextup-A43nfOHifhO5Ip7m3E49wadpudXUvjW7dKRoZ47bAQ4WNtqWs2Y5ymMuUANXY0qU4Tji_KOC0Q';
const puuid = '04f35881-6711-592d-87d1-4c751d3e7930';

const ciphers = ['ECDHE-ECDSA-CHACHA20-POLY1305','ECDHE-RSA-CHACHA20-POLY1305','ECDHE-ECDSA-AES128-GCM-SHA256','ECDHE-RSA-AES128-GCM-SHA256','ECDHE-ECDSA-AES256-GCM-SHA384','ECDHE-RSA-AES256-GCM-SHA384'].join(':');
const agent = new https.Agent({ ciphers, honorCipherOrder: true, minVersion: 'TLSv1.2' });

// Decode JWT fully
const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'));
console.log('Full JWT payload:', JSON.stringify(payload, null, 2));

async function run() {
    const entRes = await axios.post('https://entitlements.auth.riotgames.com/api/token/v1', {}, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        httpsAgent: agent
    });
    const ent = entRes.data.entitlements_token;
    console.log('\nEnt decoded pp:', JSON.parse(Buffer.from(entRes.data.entitlements_token.split('.')[1], 'base64url').toString()));
    
    // Try Riot's player preferences endpoint which reveals account region
    try {
        const prefsRes = await axios.get(`https://playerpreferences.riotgames.com/playerPref/v3/getPreference/Ares.PlayerSettings`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Riot-Entitlements-JWT': ent,
            }
        });
        console.log('\nPlayer prefs region:', prefsRes.data);
    } catch(e) {
        console.log('\nPlayer prefs error:', e.response ? e.response.status : e.message);
    }

    // Try different pd URLs: maybe account registered on a different shard
    const clientVersion = 'release-12.06-shipping-19-4440219';
    const shards = ['ap', 'na', 'eu', 'kr'];
    for (const shard of shards) {
        try {
            const res = await axios.get(`https://pd.${shard}.a.pvp.net/account-xp/v1/players/${puuid}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Riot-Entitlements-JWT': ent,
                    'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
                    'X-Riot-ClientVersion': clientVersion,
                    'User-Agent': 'ShooterGame/13 Windows/10.0.19043.1.256.64bit'
                },
                httpsAgent: agent
            });
            console.log(`\n✅ [${shard}] account-xp: ${res.status}`);
        } catch(e) {
            console.log(`[${shard}] account-xp: ${e.response ? e.response.status : e.message}`);
        }
    }
}

run().catch(console.error);
