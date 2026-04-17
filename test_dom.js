const puppeteer = require('puppeteer-core');
const fs = require('fs');

function findChromePath() {
    const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ];
    for (let p of paths) {
        if (fs.existsSync(p)) return p;
    }
    throw new Error('Chrome not found');
}

async function run() {
    const browser = await puppeteer.launch({ 
        executablePath: findChromePath(),
        headless: 'new'
    });
    const page = await browser.newPage();
    try {
        await page.goto('https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1', { waitUntil: 'networkidle2' });
        await page.waitForSelector('input[name="username"]', { timeout: 15000 });
        
        // Evaluate page to find the button
        const html = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.map(b => b.outerHTML).join('\n');
        });
        console.log("BUTTONS:\n", html);
    } catch(e) {
        console.log("ERR:", e);
    } finally {
        await browser.close();
    }
}
run();
