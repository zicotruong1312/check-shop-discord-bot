const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');

const EPHEMERAL = { flags: MessageFlags.Ephemeral };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('login')
        .setDescription('Đăng nhập tài khoản Riot Games để xem shop (An toàn - Mã hóa)'),
    async execute(interaction) {
        const riotLoginUrl = 'https://account.riotgames.com/';
        const riotAuthUrl = 'https://auth.riotgames.com/authorize?redirect_uri=http%3A%2F%2Flocalhost%2Fredirect&client_id=riot-client&response_type=token%20id_token&nonce=1';

        const embed = new EmbedBuilder()
            .setTitle('🔑 Đăng Nhập Riot — Xem Shop Valorant')
            .setDescription(
                `> ⚠️ Không dùng \`/shop\` khi đang mở game. Bot không lưu mật khẩu của bạn.\n\n` +
                `**1️⃣ Đăng nhập đúng tài khoản**\n` +
                `→ **[Vào trang Riot để xác nhận / đổi acc](${riotLoginUrl})**\n\n` +
                `**2️⃣ Lấy token**\n` +
                `→ **[Nhấn vào đây sau khi đúng acc rồi](${riotAuthUrl})**\n` +
                `Trình duyệt báo lỗi? **Bình thường!** Lên URL bar, copy toàn bộ link \`http://localhost/redirect#access_token=...\`\n\n` +
                `**3️⃣ Dán link vào bot**\n` +
                `→ Nhấn nút bên dưới và dán link vừa copy vào.`
            )
            .setColor('#FF4655')
            .setFooter({ text: '🔐 Chỉ bạn mới thấy tin nhắn này' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('login_btn_paste_url')
                    .setLabel('📋 Dán Link Token Vào Đây')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({ embeds: [embed], components: [row], ...EPHEMERAL });
    },
};
