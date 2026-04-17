const cron = require('node-cron');
const UserSession = require('../models/UserSession');
const Wishlist = require('../models/Wishlist');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
    // Chạy lúc 16:00 mỗi ngày
    cron.schedule('0 16 * * *', async () => {
        console.log("[Reminder Job] Đang kiểm tra người dùng chưa xem shop ngày hôm nay...");
        
        try {
            // Xác định thời điểm reset shop gần nhất (7:00 sáng hôm nay)
            const now = new Date();
            const resetTime = new Date(now);
            resetTime.setHours(7, 0, 0, 0); // 7:00 AM local time
            
            // Nếu thời điểm hiện tại chưa qua 7h sáng, mốc reset phải là 7h sáng hôm qua
            if (now < resetTime) {
                resetTime.setDate(resetTime.getDate() - 1);
            }

            // Lấy tất cả user session và gom nhóm theo discordId
            const allUsers = await UserSession.find({});
            const usersMap = new Map(); // discordId -> Array of sessions
            
            for (const s of allUsers) {
                if (!usersMap.has(s.discordId)) {
                    usersMap.set(s.discordId, []);
                }
                usersMap.get(s.discordId).push(s);
            }

            let notifiedCount = 0;

            // Xử lý thông báo cho từng Discord User
            for (const [discordId, userSessions] of usersMap) {
                try {
                    const wishlists = await Wishlist.find({ discordId: discordId });
                    const uncheckedAccounts = [];

                    for (const session of userSessions) {
                        const hasCheckedToday = session.lastShopCheck && new Date(session.lastShopCheck) >= resetTime;
                        if (!hasCheckedToday) {
                            uncheckedAccounts.push(session.riotUsername);
                        }
                    }

                    // Nếu có ít nhất 1 tài khoản chưa check thì mới gửi nhắc nhở
                    if (uncheckedAccounts.length > 0) {
                        const userDiscord = await client.users.fetch(discordId).catch(() => null);
                        if (userDiscord) {
                            const accountsStr = uncheckedAccounts.map(name => `• **${name}**`).join('\n');
                            
                            let messageDesc = wishlists.length > 0 
                                ? `Chào bạn! Bạn có **${wishlists.length} skin** đang ngóng trong Wishlist nhưng từ sáng tới giờ bạn chưa kiểm tra cửa hàng cho các tài khoản sau đâu nhé:\n\n${accountsStr}\n\nHãy nhanh tay check shop (lệnh \`/shop account:...\`) kẻo lỡ đồ xịn!`
                                : `Chào bạn! Cửa hàng hôm nay đã làm mới rồi nhưng dường như bạn chưa ngó qua cho các tài khoản sau:\n\n${accountsStr}\n\nHãy dành thời gian dùng \`/shop\` kiểm tra xem có skin nào ưng ý không nhé!`;

                            const embed = new EmbedBuilder()
                                .setTitle('👋 Nhắc nhở từ Valorant Shop Bot')
                                .setDescription(messageDesc)
                                .setColor('#009bde')
                                .setFooter({ text: 'Bot tự động nhắc vì bạn chưa check shop hôm nay' })
                                .setTimestamp();
                            
                            await userDiscord.send({ embeds: [embed] }).catch(() => {
                                console.log(`[Reminder Job] Không thể gửi DM cho user ${discordId}`);
                            });
                            notifiedCount++;
                        }
                    }
                } catch (err) {
                    console.error(`[Reminder Job] Lỗi xử lý user ${discordId}: `, err);
                }
            }

            console.log(`[Reminder Job] Hoàn thành. Đã gửi nhắc nhở cho ${notifiedCount} người.`);
        } catch (err) {
            console.error("[Reminder Job] Lỗi truy xuất DB: ", err);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh" 
    });
};
