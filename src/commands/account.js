const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserSession = require('../models/UserSession');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('account')
        .setDescription('Quản lý danh sách tài khoản Riot đã liên kết')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Xem danh sách tài khoản đã kết nối')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Gỡ thẻ kết nối tài khoản')
                .addStringOption(option =>
                    option.setName('riot_name')
                        .setDescription('Tên tài khoản Ingame (Ví dụ: CAV Zico#2204)')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),
        
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'remove') {
            const sessions = await UserSession.find({ discordId: interaction.user.id });
            const filtered = sessions
                .filter(s => s.riotUsername.toLowerCase().includes(focusedValue.toLowerCase()))
                .slice(0, 25);
                
            await interaction.respond(
                filtered.map(s => ({ name: s.riotUsername, value: s.puuid }))
            );
        }
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'list') {
            const sessions = await UserSession.find({ discordId: interaction.user.id });
            if (sessions.length === 0) {
                return interaction.reply({ content: 'Bạn chưa liên kết tài khoản nào. Hãy dùng `/login` nhé!', ephemeral: true });
            }

            const description = sessions.map((s, idx) => {
                const dateText = s.lastShopCheck ? new Date(s.lastShopCheck).toLocaleString('vi-VN') : 'Chưa check';
                return `${idx + 1}. **${s.riotUsername}** (Lần cuối check shop: ${dateText})`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setTitle('📋 Danh sách Tài Khoản')
                .setDescription(description)
                .setColor('#10B981');
                
            await interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (subcommand === 'remove') {
            const puuid = interaction.options.getString('riot_name');
            const result = await UserSession.findOneAndDelete({ discordId: interaction.user.id, puuid: puuid });
            
            if (result) {
                await interaction.reply({ content: `✅ Đã xóa tài khoản **${result.riotUsername}** khỏi danh sách.`, ephemeral: true });
            } else {
                await interaction.reply({ content: 'Không tìm thấy tài khoản để xóa.', ephemeral: true });
            }
        }
    }
};
