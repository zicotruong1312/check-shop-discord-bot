const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Wishlist = require('../models/Wishlist');
const axios = require('axios');

let cachedSkins = [];
async function fetchSkins() {
    try {
        const response = await axios.get('https://valorant-api.com/v1/weapons/skins?language=en-US');
        // Chỉ lấy skin base, bỏ qua Standard (mặc định) và Random
        cachedSkins = response.data.data
            .filter(skin => skin.themeUuid !== "5a629df4-4765-0214-bd40-fbb96542941f" && skin.displayName !== "Random")
            .map(s => ({
                name: s.displayName,
                value: s.levels[0].uuid // Quan trọng: lưu UUID của level 1 để khớp với store Riot
            }));
    } catch (e) {
        console.error("Khong load duoc list sung");
    }
}
fetchSkins();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wishlist')
        .setDescription('Quản lý danh sách súng mong muốn')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Thêm 1 súng vào danh sách chờ')
                .addStringOption(option =>
                    option.setName('skin')
                        .setDescription('Tên súng')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Xem danh sách súng đang chờ'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Xóa súng khỏi danh sách')
                .addStringOption(option =>
                    option.setName('skin')
                        .setDescription('Tên súng')
                        .setRequired(true)
                        .setAutocomplete(true))),
                        
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'remove') {
            // Lấy danh sách wishlist hiện tại của user này từ database
            const userList = await Wishlist.find({ discordId: interaction.user.id });
            const userSkins = userList.map(item => ({ name: item.skinName, value: item.skinId }));
            
            const filtered = userSkins
                .filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()))
                .slice(0, 25);
                
            await interaction.respond(
                filtered.map(choice => ({ name: choice.name, value: choice.value }))
            );
        } else {
            // Lệnh add: Lấy từ bộ nhớ đệm (tất cả súng trong game)
            const filtered = cachedSkins
                .filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()))
                .slice(0, 25);
                
            await interaction.respond(
                filtered.map(choice => ({ name: choice.name, value: choice.value }))
            );
        }
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const skinId = interaction.options.getString('skin');
            const skinData = cachedSkins.find(s => s.value === skinId);
            if (!skinData) return interaction.reply({ content: 'Súng không hợp lệ!', ephemeral: true });

            try {
                await Wishlist.create({
                    discordId: interaction.user.id,
                    skinId: skinData.value,
                    skinName: skinData.name
                });
                await interaction.reply({ content: `✅ Đã thêm **${skinData.name}** vào Wishlist. Tớ sẽ thông báo khi nó xuất hiện!`, ephemeral: true });
            } catch (err) {
                if (err.code === 11000) {
                    return interaction.reply({ content: 'Súng này đã có trong danh sách của bạn rồi.', ephemeral: true });
                }
                console.error(err);
                await interaction.reply({ content: 'Lỗi Database.', ephemeral: true });
            }
        } else if (subcommand === 'list') {
            const list = await Wishlist.find({ discordId: interaction.user.id });
            if (list.length === 0) return interaction.reply({ content: 'Wishlist của bạn đang trống.', ephemeral: true });

            const description = list.map((item, index) => `${index + 1}. **${item.skinName}**`).join('\n');
            const embed = new EmbedBuilder()
                .setTitle('⭐ Danh Sách Wishlist Của Bạn')
                .setDescription(description)
                .setColor('#FF4655');
            await interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (subcommand === 'remove') {
            const skinId = interaction.options.getString('skin');
            const result = await Wishlist.findOneAndDelete({ discordId: interaction.user.id, skinId });
            
            if (result) {
                await interaction.reply({ content: `🗑️ Đã xóa **${result.skinName}** khỏi Wishlist.`, ephemeral: true });
            } else {
                await interaction.reply({ content: `Súng không có trong Wishlist của bạn.`, ephemeral: true });
            }
        }
    },
};
