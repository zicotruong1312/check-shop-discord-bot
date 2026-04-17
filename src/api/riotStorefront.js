const axios = require('axios');

const REGION_MAP = {
    'as': 'ap', 'as1': 'ap', 'as2': 'ap', 'as3': 'ap',
    'eu': 'eu', 'eu1': 'eu', 'eu2': 'eu', 'eu3': 'eu',
    'na': 'na', 'na1': 'na', 'na2': 'na',
    'kr': 'kr', 'kr1': 'kr',
    'br': 'br', 'br1': 'br',
    'latam': 'latam', 'la1': 'latam', 'la2': 'latam'
};

// Known Valorant currency UUIDs
const VP_ID = '85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741';
const RP_ID = 'e59aa87c-4cbf-517a-5983-6e81511be9b7';
const KP_ID = '85ca954a-41f2-ce94-9b45-8ca3dd39a00d';

function getRegionFromToken(accessToken) {
    try {
        const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString('utf8'));
        const raw = (payload.dat && payload.dat.c) ? payload.dat.c.toLowerCase() : 'as1';
        if (REGION_MAP[raw]) return REGION_MAP[raw];
        return REGION_MAP[raw.replace(/\d+$/, '')] || 'ap';
    } catch { return 'ap'; }
}

// Cache client version — refreshed every 6 hours
let cachedClientVersion = null;
let versionFetchedAt = 0;
async function getClientVersion() {
    if (cachedClientVersion && Date.now() - versionFetchedAt < 6 * 60 * 60 * 1000) return cachedClientVersion;
    try {
        const res = await axios.get('https://valorant-api.com/v1/version');
        cachedClientVersion = res.data.data.riotClientVersion;
        versionFetchedAt = Date.now();
        console.log(`[Store] Version: ${cachedClientVersion}`);
    } catch {
        cachedClientVersion = cachedClientVersion || 'release-12.06-shipping-19-4440219';
    }
    return cachedClientVersion;
}

function buildHeaders(accessToken, entitlementsToken, clientVersion) {
    return {
        'Authorization': `Bearer ${accessToken}`,
        'X-Riot-Entitlements-JWT': entitlementsToken,
        'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
        'X-Riot-ClientVersion': clientVersion,
        'User-Agent': 'ShooterGame/13 Windows/10.0.19043.1.256.64bit',
        'Content-Type': 'application/json'
    };
}

/**
 * GET storefront → { skinIds: string[], priceMap: { [skinId]: vpCost } }
 */
async function getStorefront(accessToken, entitlementsToken, puuid) {
    const region = getRegionFromToken(accessToken);
    const clientVersion = await getClientVersion();
    const url = `https://pd.${region}.a.pvp.net/store/v3/storefront/${puuid}`;

    try {
        const response = await axios.post(url, {}, {
            headers: buildHeaders(accessToken, entitlementsToken, clientVersion)
        });

        const sp = response.data.SkinsPanelLayout;
        const skinIds = sp.SingleItemOffers;

        const priceMap = {};
        for (const offer of sp.SingleItemStoreOffers || []) {
            priceMap[offer.OfferID] = offer.Cost?.[VP_ID] ?? 0;
        }

        return { skinIds, priceMap };
    } catch (err) {
        const status = err.response?.status ?? 'No response';
        const data = err.response ? JSON.stringify(err.response.data) : err.message;
        console.error(`[Shop] Region=${region} PUUID=${puuid} Status=${status} Body=${data}`);
        throw new Error(`Lỗi lấy shop (${status}). Hãy thử /login lại nhé.`);
    }
}

/**
 * GET wallet → { vp, rp, kp }
 */
async function getWallet(accessToken, entitlementsToken, puuid) {
    const region = getRegionFromToken(accessToken);
    const clientVersion = await getClientVersion();
    const url = `https://pd.${region}.a.pvp.net/store/v1/wallet/${puuid}`;

    try {
        const response = await axios.get(url, {
            headers: buildHeaders(accessToken, entitlementsToken, clientVersion)
        });
        const b = response.data.Balances || {};
        return {
            vp: b[VP_ID] ?? 0,
            rp: b[RP_ID] ?? 0,
            kp: b[KP_ID] ?? 0
        };
    } catch (err) {
        console.error('[Wallet] Error:', err.response?.status, err.message);
        return { vp: '?', rp: '?', kp: '?' };
    }
}

/**
 * GET skin details from valorant-api.com, enriched with price
 */
async function getSkinDetails(skinIds, priceMap = {}) {
    try {
        const response = await axios.get('https://valorant-api.com/v1/weapons/skinlevels?language=en-US');
        const allSkins = response.data.data;
        return skinIds.map(id => {
            const skin = allSkins.find(s => s.uuid === id);
            return {
                id,
                name: skin?.displayName ?? 'Unknown Skin',
                icon: skin?.displayIcon ?? null,
                price: priceMap[id] ?? 0
            };
        });
    } catch {
        return skinIds.map(id => ({ id, name: 'Unknown Skin', icon: null, price: priceMap[id] ?? 0 }));
    }
}

module.exports = { getStorefront, getWallet, getSkinDetails };
