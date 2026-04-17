const axios = require('axios');
const https = require('https');

// Riot TLS Ciphers to prevent Cloudflare blocks
const ciphers = [
    'ECDHE-ECDSA-CHACHA20-POLY1305',
    'ECDHE-RSA-CHACHA20-POLY1305',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-AES128-SHA',
    'ECDHE-RSA-AES128-SHA',
    'ECDHE-ECDSA-AES256-SHA',
    'ECDHE-RSA-AES256-SHA',
    'AES128-GCM-SHA256',
    'AES256-GCM-SHA384',
    'AES128-SHA',
    'AES256-SHA',
    'DES-CBC3-SHA'
].join(':');

const agent = new https.Agent({
    ciphers,
    honorCipherOrder: true,
    minVersion: 'TLSv1.2'
});

const defaultHeaders = {
    'User-Agent': 'RiotClient/94.0.0.5283451.4785415 rso-auth (Windows;10;;Professional, x64)',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
    'X-Riot-ClientVersion': 'release-09.00-shipping-1-2679261'
};

function extractTokensFromUrl(redirectUrl) {
    const raw = redirectUrl.trim();

    // ── Kiểm tra sơ bộ cú pháp trước khi parse ─────────────────────────
    if (!raw.startsWith('http')) {
        throw new Error(
            '❌ **Link không hợp lệ!**\n\n' +
            '🔎 Bạn cần copy **toàn bộ đường link** từ **thanh địa chỉ trình duyệt** sau khi đăng nhập Riot.\n\n' +
            '✅ **Link đúng trông như thế này:**\n' +
            '`http://localhost/redirect#access_token=eyJhbGciOiJ...`\n\n' +
            '❌ **Bạn KHÔNG nên dán:**\n' +
            '• Mật khẩu / username\n' +
            '• Link trang đăng nhập (auth.riotgames.com)\n' +
            '• Chỉ một phần của link'
        );
    }

    if (!raw.includes('access_token')) {
        throw new Error(
            '❌ **Link thiếu Access Token!**\n\n' +
            '🔎 Có vẻ bạn đã copy **nhầm link** — link đúng phải chứa `access_token=` ở trong.\n\n' +
            '📋 **Cách làm đúng:**\n' +
            '1. Mở link đăng nhập → đăng nhập bằng tài khoản Riot\n' +
            '2. Trình duyệt hiện **"This site can\'t be reached"** → **BÌNH THƯỜNG!**\n' +
            '3. Nhìn lên **thanh địa chỉ (URL bar)** → bôi đen và copy **toàn bộ**\n' +
            '4. Link copy đúng bắt đầu bằng: `http://localhost/redirect#access_token=eyJ...`'
        );
    }

    // ── Parse URL ────────────────────────────────────────────────────────
    const urlStr = raw.replace('#', '?');
    try {
        const url = new URL(urlStr);
        const accessToken = url.searchParams.get('access_token');
        const idToken = url.searchParams.get('id_token');

        if (!accessToken || accessToken.split('.').length !== 3) {
            throw new Error(
                '❌ **Access Token không hợp lệ hoặc bị cắt ngắn!**\n\n' +
                '🔎 Có thể bạn chỉ copy được **một phần** của link.\n\n' +
                '📋 **Hãy thử lại:**\n' +
                '• Dùng **Ctrl+A** để bôi đen toàn bộ nội dung trong thanh địa chỉ\n' +
                '• Sau đó **Ctrl+C** để copy\n' +
                '• Dán vào ô này và bấm Gửi'
            );
        }

        return { accessToken, idToken };
    } catch (e) {
        if (e.message.startsWith('❌')) throw e;
        throw new Error(
            '❌ **Link bị lỗi định dạng!**\n\n' +
            '🔎 Bot không thể đọc link bạn vừa dán.\n\n' +
            '✅ **Link đúng trông như thế này:**\n' +
            '`http://localhost/redirect#access_token=eyJhbGciOiJ...&token_type=Bearer&...`\n\n' +
            '💡 **Mẹo:** Dùng trình duyệt **Chrome** hoặc **Edge** để đăng nhập, tránh dùng Firefox vì đôi khi bị lỗi redirect.'
        );
    }
}


async function getEntitlementsAndPuuid(accessToken) {
    // 1. Get Entitlements Token
    const entUrl = 'https://entitlements.auth.riotgames.com/api/token/v1';
    const entResponse = await axios.post(entUrl, {}, {
        headers: {
            ...defaultHeaders,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        httpsAgent: agent
    });
    const entitlementsToken = entResponse.data.entitlements_token;

    // 2. Decode PUUID directly from Access Token JWT
    const parts = accessToken.split('.');
    let puuid = '';
    try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        puuid = payload.sub;
    } catch (e) {
        throw new Error("Không thể giải mã Access Token để lấy PUUID.");
    }

    return { entitlementsToken, puuid };
}

async function getPlayerName(accessToken, entitlementsToken, puuid) {
    const url = 'https://pd.ap.a.pvp.net/name-service/v2/players';
    try {
        const response = await axios.put(url, [puuid], {
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${accessToken}`,
                'X-Riot-Entitlements-JWT': entitlementsToken
            },
            httpsAgent: agent
        });
        const data = response.data[0];
        if (data && data.GameName) {
            return `${data.GameName}#${data.TagLine}`;
        }
        return `Unknown`;
    } catch (e) {
        console.error("Lấy tên Ingame lỗi:", e.response?.data ?? e.message);
        return `Unknown`;
    }
}

module.exports = {
    extractTokensFromUrl,
    getEntitlementsAndPuuid,
    getPlayerName
};
