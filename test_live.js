/**
 * Live Storefront Test — dùng web token để xác nhận region detection hoạt động đúng
 */
const { extractTokensFromUrl, getEntitlementsAndPuuid } = require('./src/api/riotAuth');
const { getStorefront } = require('./src/api/riotStorefront');

const URL = 'https://playvalorant.com/vi-vn/opt_in/#access_token=eyJraWQiOiJyc28tcHJvZC0yMDI0LTExIiwiYWxnIjoiUlMyNTYifQ.eyJwcCI6eyJjIjoiYXMifSwic3ViIjoiMDRmMzU4ODEtNjcxMS01OTJkLTg3ZDEtNGM3NTFkM2U3OTMwIiwic2NwIjpbXSwiYWNyIjoidXJuOnJpb3Q6YnJvbnplIiwiZGF0Ijp7ImMiOiJhczEiLCJsaWQiOiJCVmtLbDhiNjJRY3VqX01ENGxHVm9RIn0sImFtciI6WyJwYXNzd29yZCJdLCJpc3MiOiJodHRwczovL2F1dGgucmlvdGdhbWVzLmNvbSIsInBsdCI6eyJkZXYiOiJ1bmtub3duIiwiaWQiOiJ3ZWIifSwiZXhwIjoxNzc2MzU0OTA4LCJpYXQiOjE3NzYzNTEzMDgsImp0aSI6IkY5elFlVGVsUHhzIiwiY2lkIjoicGxheS12YWxvcmFudC13ZWItcHJvZCJ9.YRGPYIxl2_KV7u3L9LH8nlG07n_l07rCNgf5LjLu7x_gmFABeBJcyutPhtV3ec_0x0oIyRlNaT_gr8g3S9n48wEC1iZCHT2FIWCo-rGhGf_sguxldaBJLGSty-FOOBbbBBlkxd_hW4-CjCkEc9bKkXPRCJ_vbThMvEH9z3fHecGTpkMLlNLq3yTAl7dNum8vPi2iE9fsI_vYkQH6QsQO_pmQQ4TdKD22Vyo4rWJwkAw1t8rt4iTJMRQcGhdHcwR1Ql8j8PXyqEu40Kjf7JNUJXCT5xFIGWQ4Q_pWd2DfCLOCj44OI4KEfzJTQE0CBonFquKbGWQiVg6Bdo_KXAxTIg&scope=&iss=https%3A%2F%2Fauth.riotgames.com&token_type=Bearer&session_state=-F-qOBPhfFKS6epjq4qgeFr2jsxyaF4kSAECV_lg11Q.HAswU1h0XzfDoIxpob7XkQ&expires_in=3600';

async function run() {
    console.log('🔍 Test live storefront with web token...\n');
    
    const { accessToken } = extractTokensFromUrl(URL);
    
    // Check expiry
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString('utf8'));
    console.log(`Token cid: ${payload.cid}`);
    console.log(`Token region: ${payload.dat && payload.dat.c}`);
    console.log(`Token expired: ${Date.now() > payload.exp * 1000}`);
    
    const { entitlementsToken, puuid } = await getEntitlementsAndPuuid(accessToken);
    console.log(`\nEntitlement OK - PUUID: ${puuid}`);
    
    try {
        const skins = await getStorefront(accessToken, entitlementsToken, puuid);
        console.log(`\n✅ SHOP WORKS! Got ${skins.length} skins: ${JSON.stringify(skins)}`);
    } catch(e) {
        console.log(`\n❌ Shop error: ${e.message}`);
        console.log('(Expected for web token — riot-client token required for pd.*.a.pvp.net)');
    }
}

run().catch(console.error);
