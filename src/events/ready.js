const { ActivityType } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Bot đã sẵn sàng! Đăng nhập với tên ${client.user.tag}`);
        client.user.setActivity('Valorant Shop', { type: ActivityType.Watching });
    },
};
