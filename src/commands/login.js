const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('login')
        .setDescription('Đăng nhập tài khoản Riot Games để xem shop (An toàn - Mã hóa)'),
    async execute(interaction) {
        const riotAuthUrl = 'https://auth.riotgames.com/authorize?redirect_uri=http%3A%2F%2Flocalhost%2Fredirect&client_id=riot-client&response_type=token%20id_token&nonce=1';

        const embed = new EmbedBuilder()
            .setTitle('🔒 Đăng Nhập Tài Khoản Riot — Xem Shop Valorant')
            .setDescription(
                `> ⚠️ **LƯU Ý QUAN TRỌNG:**\n` +
                `> • KHÔNG dùng \`/shop\` khi đang mở game Valorant — có thể bị văng game hoặc ép **đổi mật khẩu**!\n` +
                `> • Bot chỉ dùng token tạm thời (1 tiếng), **không lưu mật khẩu**. Bạn tự chịu trách nhiệm khi sử dụng.\n\n` +

                `## 🎮 Bước 0 — Chọn đúng tài khoản muốn xem shop\n` +
                `Trước khi làm gì, hãy đảm bảo trình duyệt của bạn đang **đăng nhập đúng tài khoản Riot** mà bạn muốn check shop.\n\n` +
                `🔁 **Muốn đăng nhập acc khác?**\n` +
                `Nhấn **chuột phải** vào link bên dưới → chọn **"Mở bằng Tab Ẩn Danh (Incognito/Private)"** để tránh bị tự động đăng nhập acc cũ.\n\n` +

                `## 🌐 Bước 1 — Mở trang đăng nhập Riot\n` +
                `👉 **[Nhấn vào đây để đăng nhập](${riotAuthUrl})**\n` +
                `*(Bạn tự gõ mật khẩu trên trình duyệt — Bot không nhìn thấy)*\n\n` +

                `## 📋 Bước 2 — Copy đường link sau khi đăng nhập\n` +
                `Trình duyệt hiện **"This site can't be reached"**? → **Bình thường!**\n` +
                `Nhìn lên **thanh địa chỉ (URL bar)**, bôi đen và **copy toàn bộ** link bắt đầu bằng:\n` +
                `\`http://localhost/redirect#access_token=...\`\n\n` +

                `## ✅ Bước 3 — Dán link vào đây\n` +
                `Nhấn nút **"Tiếp Tục"** bên dưới rồi dán link vừa copy vào ô hiện ra.`
            )
            .setColor('#10B981')
            .setFooter({ text: '🔐 Chỉ bạn mới thấy tin nhắn này' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('login_btn_paste_url')
                    .setLabel('Tiếp Tục (Dán Link Ở Đây)')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },
};
