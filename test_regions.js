const axios = require('axios');

// Use token from the most recent login
const accessToken = 'eyJraWQiOiJyc28tcHJvZC0yMDI0LTExIiwiYWxnIjoiUlMyNTYifQ.eyJwcCI6eyJjIjoiYXMifSwic3ViIjoiMDRmMzU4ODEtNjcxMS01OTJkLTg3ZDEtNGM3NTFkM2U3OTMwIiwic2NwIjpbXSwiYWNyIjoidXJuOnJpb3Q6YnJvbnplIiwiZGF0Ijp7ImMiOiJhczEiLCJsaWQiOiJDa0ZqWTBhNWhpSGtUMzl0eUNaTVFBIn0sImFtciI6WyJwYXNzd29yZCJdLCJpc3MiOiJodHRwczovL2F1dGgucmlvdGdhbWVzLmNvbSIsInBsdCI6eyJkZXYiOiJ1bmtub3duIiwiaWQiOiJ3ZWIifSwiZXhwIjoxNzc2MzU0MDU4LCJpYXQiOjE3NzYzNTA0NTgsImp0aSI6IjNKOVBWclRNVTlZIiwiY2lkIjoicGxheS12YWxvcmFudC13ZWItcHJvZCJ9.O2Zrkkc9i5ROKpirk2MONLx9FaI51LONZeDLedPYDCrcKd5HXmP-TfTx-EkHtg8zXXkv1BJObom30dxaRLW6W2OHSwaTWl3xyGbCEsHycb3j7SHNr1bv-QQ-NEdWTkAQ2EJGUTP0BWAtO2fsgRWHRnkOHke_ZGeIYZDEYonZ7VZOC7HIPYzT5CagHIo4VjA-aA_6DDZw4d3CFclIaRpdezgkYu29RuejYFNs7iRsF3RnlluUDXUYnjLwa6_jrkNAEA4SXOp-j5qHTh8QR_TKWefxZR1Q6LGGADud75lpG9gYK-sI8bngN7LvHZ8N6zy5OIoGGOa_mRjuzQ4_kNEOWg';
const entitlementsToken = 'eyJraWQiOiJrMSIsImFsZyI6IlJTMjU2In0.eyJlbnRpdGxlbWVudHMiOltdLCJhdF9oYXNoIjoiSGMzR1h3NXR0WnhlYm5Jc1NmNU14dyIsInN1YiI6IjA0ZjM1ODgxLTY3MTEtNTkyZC04N2QxLTRjNzUxZDNlNzkzMCIsImlzcyI6Imh0dHBzOi8vZW50aXRsZW1lbnRzLmF1dGgucmlvdGdhbWVzLmNvbSIsImlhdCI6MTc3NjM1MDY1MSwianRpIjoiM0o5UFZyVE1VOVkifQ.xzggPCLJzVvBpg4cuOaus9xiJ45uVbXQlfSkBDFegn9Le9_NZBxPTliWS95MYtqaCLtVaZH0bs3qC7iUeI91JdRCvGbYhuOIedTskcZAW6kuULAsboAzAVzGWwINjCGyeGj9WAdBR61jOZ52lrhozltuLtFawS8ISgl8cJH75ZSwEWbAfXFzNtdGkWhVlfDWPFETYryLa8DBvtFu6TVe8YNTL7YbJi0AE5rcz7OiVEbbICUuMGKsnnRviTFQ9nW7HAhL5b-VGLwMVZXbXZChce9hK84zleZDnDwBCqu0-fjzjaj2DEf4dhQlZFvoZAx-33huOFzLhs4LvB7Yxvbaaw';
const puuid = '04f35881-6711-592d-87d1-4c751d3e7930';

// Decode token first
const parts = accessToken.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
console.log('Token dat.c =', payload.dat ? payload.dat.c : 'undefined');
console.log('Token exp =', new Date(payload.exp * 1000).toISOString(), '(token expired?', Date.now() > payload.exp * 1000, ')');

const regions = ['ap', 'na', 'eu', 'kr', 'br', 'latam'];
const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'X-Riot-Entitlements-JWT': entitlementsToken,
    'User-Agent': 'ShooterGame/13 Windows/10.0.19043.1.256.64bit',
    'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
    'X-Riot-ClientVersion': 'release-09.00-shipping-1-2679261'
};

async function testAllRegions() {
    for (const region of regions) {
        const url = `https://pd.${region}.a.pvp.net/store/v2/storefront/${puuid}`;
        try {
            const res = await axios.get(url, { headers });
            console.log(`[${region}] ✅ OK - Got ${res.data.SkinsPanelLayout ? res.data.SkinsPanelLayout.SingleItemOffers.length : '?'} skins`);
        } catch (e) {
            console.log(`[${region}] ❌ ${e.response ? e.response.status : e.message}`);
        }
    }
}

testAllRegions();
