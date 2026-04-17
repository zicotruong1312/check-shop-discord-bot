const cron = require('node-cron');
const UserSession = require('../models/UserSession');
const Wishlist = require('../models/Wishlist');
const { decrypt } = require('../utils/encryption');
const { getTokens } = require('../api/riotAuth');
const { getStorefront } = require('../api/riotStorefront');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
    cron.schedule('05 07 * * *', async () => {
        console.log("Bắt đầu Job Săn Shop...");
        
        try {
            const allUsers = await UserSession.find({});
            console.log(`Tìm thấy ${allUsers.length} users. Bắt đầu Batch Processing.`);

            const BATCH_SIZE = 50;
            const DELAY_BETWEEN_BATCHES = 10000; 
            
            for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
                const batch = allUsers.slice(i, i + BATCH_SIZE);
                
                await Promise.all(batch.map(async (userSession) => {
                    try {
                        const wishlists = await Wishlist.find({ discordId: userSession.discordId });
                        if (wishlists.length === 0) return;

                        const tokensJson = decrypt(userSession.encryptedCookies, userSession.iv);
                        let accessToken, entitlementsToken, puuid;
                        try {
                            ({ accessToken, entitlementsToken, puuid } = JSON.parse(tokensJson));
                        } catch (e) {
                            console.error(`Token parse lỗi cho user ${userSession.discordId}: ${e.message}`);
                            return;
                        }
                        
                        const storefront = await getStorefront(accessToken, entitlementsToken, puuid);
                        const skinIds = storefront.skinIds || storefront; // Fallback in case of refactor

                        for (let wish of wishlists) {
                            if (skinIds.includes(wish.skinId)) {
                                const userDiscord = await client.users.fetch(userSession.discordId).catch(() => null);
                                if (userDiscord) {
                                    const embed = new EmbedBuilder()
                                        .setTitle('🎯 WISHLIST MATCH!')
                                        .setDescription(`Chào bạn, súng **${wish.skinName}** bạn đợi bấy lâu nay đã xuất hiện trong cửa hàng của tài khoản **${userSession.riotUsername}** hôm nay rồi kìa! Vào game mua lẹ thôi! (Nhập lệnh \`/shop account:${userSession.riotUsername}\` để xem chi tiết nhé)`)
                                        .setColor('#FF4655')
                                        .setTimestamp();
                                    
                                    await userDiscord.send({ embeds: [embed] }).catch(err => console.log(`Không thể gửi DM cho user ${userSession.discordId}`));
                                }
                            }
                        }
                    } catch (e) {
                         console.error(`Lỗi khi quét shop cho user ${userSession.discordId}: `, e.message);
                    }
                }));

                console.log(`Hoàn thành batch ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(allUsers.length / BATCH_SIZE)}.`);
                if (i + BATCH_SIZE < allUsers.length) {
                     await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
                }
            }

            console.log("Hoàn thành quét toàn bộ user.");
        } catch (err) {
            console.error("Lỗi Cron Job: ", err);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh" 
    });
};
