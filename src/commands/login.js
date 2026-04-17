const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('login')
        .setDescription('Đăng nhập tài khoản Riot Games để xem shop (An toàn - Mã hóa)'),
    async execute(interaction) {
        const riotAuthUrl = 'https://auth.riotgames.com/authorize?redirect_uri=http%3A%2F%2Flocalhost%2Fredirect&client_id=riot-client&response_type=token%20id_token&nonce=1';

        const embed = new EmbedBuilder()
            .setTitle('🔒 Xem Shop Valorant — Đăng nhập An Toàn')
            .setDescription(
                `> ⚠️ **LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI DÙNG:**\n` +
                `> **1.** KHÔNG dùng lệnh \`/shop\` khi đang mở game Valorant. Riot chỉ cho phép 1 thiết bị tương tác cùng lúc. Vừa mở game vừa check bot sẽ bị Riot văng game, báo lỗi session hoặc ép **đổi mật khẩu**!\n` +
                `> **2.** Bot sử dụng token tạm thời (1 tiếng), không lưu mật khẩu của bạn. Tính đến hiện tại, Riot chưa từng **ban (khóa vĩnh viễn)** ai vì dùng bot soi shop, tuy nhiên việc dùng tool hãng thứ 3 luôn có 1% rủi ro (bị theo dõi, ép đổi pass). Bạn tự chịu trách nhiệm khi sử dụng nhé!\n\n` +
                `**Bước 1 — Mở trang đăng nhập Riot:**\n` +
                `👉 **[Nhấn vào đây để đăng nhập](${riotAuthUrl})**\n` +
                `*(Bạn tự đăng nhập trên trình duyệt của mình — Bot không nhìn thấy mật khẩu)*\n\n` +
                `**Bước 2 — Copy đường link:**\n` +
                `Trình duyệt hiện chữ **"This site can't be reached"** (Trang web này không thể truy cập)?\n` +
                `✅ **BÌNH THƯỜNG!** Hãy nhìn lên **thanh địa chỉ web** (URL bar), bạn sẽ thấy link bắt đầu bằng \`http://localhost/redirect#access_token=...\`\n\n` +
                `📋 **Bôi đen và Copy TOÀN BỘ đường link đó.**\n\n` +
                `**Bước 3 — Dán vào đây:**\n` +
                `Nhấn nút \`Tiếp Tục\` bên dưới rồi dán link vừa copy vào ô hiện ra.`
            )
            .setColor('#10B981')
            .setFooter({ text: '🔐 Đọc kỹ cảnh báo phía trên trước khi tiếp tục' });

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
