const { extractTokensFromUrl, getEntitlementsAndPuuid } = require('./src/api/riotAuth');
const { getStorefront } = require('./src/api/riotStorefront');

const URL = 'http://localhost/redirect#access_token=eyJraWQiOiJyc28tcHJvZC0yMDI0LTExIiwiYWxnIjoiUlMyNTYifQ.eyJwcCI6eyJjIjoiYXMifSwic3ViIjoiMDRmMzU4ODEtNjcxMS01OTJkLTg3ZDEtNGM3NTFkM2U3OTMwIiwic2NwIjpbXSwiYWNyIjoidXJuOnJpb3Q6YnJvbnplIiwiZGF0Ijp7ImMiOiJhczEiLCJsaWQiOiJCVmtLbDhiNjJRY3VqX01ENGxHVm9RIn0sImFtciI6WyJwYXNzd29yZCJdLCJpc3MiOiJodHRwczovL2F1dGgucmlvdGdhbWVzLmNvbSIsInBsdCI6eyJkZXYiOiJ1bmtub3duIiwiaWQiOiJ3ZWIifSwiZXhwIjoxNzc2MzU1NTY4LCJpYXQiOjE3NzYzNTE5NjgsImp0aSI6InRMYzBLcUxwNVpNIiwiY2lkIjoicmlvdC1jbGllbnQifQ.ZVsCtykRMt9xULrfPAnj0JK25hhoKWvoL11njvVQ1-WXmTnX3BmJt5dnOrGk-Uz8aoTqVBHHlTf_AteBazCP36wakZUzsoH0ig3TER4C78Co6QeBTg4XdD8ootC5WltQKCfuI93Bbj5heXRvC0-o3bdFjpZnF-D11L8Bdaa755TDSeYxSEIXvbsTmJX2cphI41weNFQfDejbQnpkdMcS_UeBs8dVkb1fZmENU5BEHAfYC2qm9ZmiWKQ8T9Sg-X76yU2HSXextup-A43nfOHifhO5Ip7m3E49wadpudXUvjW7dKRoZ47bAQ4WNtqWs2Y5ymMuUANXY0qU4Tji_KOC0Q&scope=&iss=https%3A%2F%2Fauth.riotgames.com&token_type=Bearer&session_state=V_RLil_V4nJ3uoUVlNImkjzwQlbvxVn-n-mjTjy42IY.yJfm_Y5kc4oImHYuda2uzQ&expires_in=3600';

async function run() {
    console.log('🔍 Testing riot-client token live...\n');
    
    const { accessToken } = extractTokensFromUrl(URL);
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString('utf8'));
    
    console.log(`cid: ${payload.cid}`);
    console.log(`region: ${payload.dat && payload.dat.c}`);
    console.log(`puuid: ${payload.sub}`);
    console.log(`expired: ${Date.now() > payload.exp * 1000}`);
    
    console.log('\nFetching entitlements...');
    const { entitlementsToken, puuid } = await getEntitlementsAndPuuid(accessToken);
    console.log(`✅ Entitlements OK`);
    
    console.log('\nFetching storefront...');
    try {
        const skins = await getStorefront(accessToken, entitlementsToken, puuid);
        console.log(`✅ SHOP SUCCESS! Skin IDs: ${JSON.stringify(skins)}`);
    } catch(e) {
        console.log(`❌ Shop failed: ${e.message}`);
    }
}

run().catch(e => console.error('Fatal:', e.message));
