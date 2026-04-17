const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('login')
        .setDescription('Đăng nhập tài khoản Riot Games để xem shop (An toàn - Mã hóa)'),
    async execute(interaction) {
        const riotLoginUrl = 'https://account.riotgames.com/';
        const riotAuthUrl = 'https://auth.riotgames.com/authorize?redirect_uri=http%3A%2F%2Flocalhost%2Fredirect&client_id=riot-client&response_type=token%20id_token&nonce=1';

        const embedStep1 = new EmbedBuilder()
            .setTitle('🔒 Đăng Nhập Tài Khoản Riot — Bước 1/2')
            .setDescription(
                `> ⚠️ **LƯU Ý QUAN TRỌNG:**\n` +
                `> • KHÔNG dùng \`/shop\` khi đang mở game Valorant — có thể bị văng game hoặc ép **đổi mật khẩu**!\n` +
                `> • Bot chỉ dùng token tạm thời (1 tiếng), **không lưu mật khẩu**. Bạn tự chịu trách nhiệm khi sử dụng.\n\n` +

                `## 🎮 Bước 1 — Đảm bảo đúng tài khoản\n` +
                `Trước tiên, hãy vào trang quản lý Riot để kiểm tra / **đăng nhập đúng tài khoản** bạn muốn check shop:\n\n` +
                `👉 **[Vào trang Riot để đăng nhập / đổi tài khoản](${riotLoginUrl})**\n\n` +
                `🔁 **Muốn đăng nhập acc khác?**\n` +
                `Nhấn **chuột phải** vào link trên → chọn **"Mở bằng Tab Ẩn Danh (Incognito)"** để tránh bị auto đăng nhập acc cũ.\n\n` +
                `✅ Sau khi đã đăng nhập **đúng acc** trên trình duyệt → nhấn nút bên dưới để sang Bước 2.`
            )
            .setColor('#3B82F6')
            .setFooter({ text: 'Bước 1/2 • Chỉ bạn mới thấy tin nhắn này' });

        const embedStep2 = new EmbedBuilder()
            .setTitle('🔑 Đăng Nhập Tài Khoản Riot — Bước 2/2')
            .setDescription(
                `## 🌐 Bước 2 — Lấy token đăng nhập\n` +
                `Đã chắc chắn đúng tài khoản? Nhấn link bên dưới để lấy token:\n\n` +
                `👉 **[Nhấn vào đây để lấy token](${riotAuthUrl})**\n\n` +
                `📋 **Sau khi nhấn:**\n` +
                `Trình duyệt sẽ hiện **"This site can't be reached"** → **Bình thường!**\n` +
                `Nhìn lên **thanh địa chỉ (URL bar)**, bôi đen và **copy toàn bộ** link bắt đầu bằng:\n` +
                `\`http://localhost/redirect#access_token=...\`\n\n` +
                `## ✅ Bước 3 — Dán link vào đây\n` +
                `Nhấn nút **"Dán Link"** bên dưới rồi dán link vừa copy vào ô hiện ra.`
            )
            .setColor('#10B981')
            .setFooter({ text: 'Bước 2/2 • Chỉ bạn mới thấy tin nhắn này' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('login_btn_paste_url')
                    .setLabel('✅ Đã đúng acc → Dán Link Ở Đây')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({ embeds: [embedStep1, embedStep2], components: [row], ephemeral: true });
    },
};
