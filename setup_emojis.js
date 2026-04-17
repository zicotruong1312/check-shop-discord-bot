/**
 * Setup script: Upload VP/RP/KP icons as Application Emojis for the bot.
 * Run ONCE: node setup_emojis.js
 */
require('dotenv').config();
const axios = require('axios');

const BOT_TOKEN = process.env.BOT_TOKEN;
const APP_ID    = process.env.CLIENT_ID;

const CURRENCIES = [
    {
        name: 'vp',
        url: 'https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/displayicon.png'
    },
    {
        name: 'rp',
        url: 'https://media.valorant-api.com/currencies/e59aa87c-4cbf-517a-5983-6e81511be9b7/displayicon.png'
    },
    {
        name: 'kp',
        url: 'https://media.valorant-api.com/currencies/85ca954a-41f2-ce94-9b45-8ca3dd39a00d/displayicon.png'
    }
];

async function imageToBase64(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const b64 = Buffer.from(res.data).toString('base64');
    return `data:image/png;base64,${b64}`;
}

async function run() {
    if (!BOT_TOKEN || !APP_ID) {
        console.error('❌  Cần TOKEN và CLIENT_ID trong file .env');
        process.exit(1);
    }

    console.log('🔍 Fetching existing application emojis...');
    const listRes = await axios.get(
        `https://discord.com/api/v10/applications/${APP_ID}/emojis`,
        { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );
    const existing = listRes.data.items || [];

    const results = {};

    for (const cur of CURRENCIES) {
        const found = existing.find(e => e.name === cur.name);
        if (found) {
            console.log(`✅ Emoji "${cur.name}" đã tồn tại — ID: ${found.id}`);
            results[cur.name] = found.id;
            continue;
        }

        console.log(`⬆️  Uploading emoji "${cur.name}"...`);
        const image = await imageToBase64(cur.url);
        const res = await axios.post(
            `https://discord.com/api/v10/applications/${APP_ID}/emojis`,
            { name: cur.name, image },
            { headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' } }
        );
        console.log(`✅ Emoji "${cur.name}" uploaded — ID: ${res.data.id}`);
        results[cur.name] = res.data.id;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Thêm các dòng sau vào file .env của bạn:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const [name, id] of Object.entries(results)) {
        console.log(`EMOJI_${name.toUpperCase()}=${id}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

run().catch(e => {
    console.error('Fatal:', e.response?.data || e.message);
    process.exit(1);
});
