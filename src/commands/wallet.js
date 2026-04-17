const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const UserSession = require('../models/UserSession');
const { decrypt } = require('../utils/encryption');
const { getWallet } = require('../api/riotStorefront');

const EPHEMERAL = { flags: MessageFlags.Ephemeral };

const E = {
    vp: `<:vp:${process.env.EMOJI_VP}>`,
    rp: `<:rp:${process.env.EMOJI_RP}>`,
    kp: `<:kp:${process.env.EMOJI_KP}>`
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('Xem số dư VP, Radianite và Kingdom Credits trong tài khoản Valorant')
        .addStringOption(option =>
            option.setName('account')
                .setDescription('Chọn tài khoản (nếu có nhiều tài khoản)')
                .setRequired(false)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const sessions = await UserSession.find({ discordId: interaction.user.id });
        const filtered = sessions
            .filter(s => s.riotUsername.toLowerCase().includes(focusedValue.toLowerCase()))
            .slice(0, 25);

        await interaction.respond(
            filtered.map(s => ({ name: s.riotUsername, value: s.puuid }))
        );
    },

    async execute(interaction) {
        await interaction.deferReply({ ...EPHEMERAL });

        try {
            const selectedPuuid = interaction.options.getString('account');
            let session;

            if (selectedPuuid) {
                session = await UserSession.findOne({ discordId: interaction.user.id, puuid: selectedPuuid });
                if (!session) {
                    return interaction.editReply('❌ Không tìm thấy tài khoản đã chọn.');
                }
            } else {
                const sessions = await UserSession.find({ discordId: interaction.user.id });
                if (sessions.length === 0) {
                    return interaction.editReply('❌ Bạn chưa đăng nhập. Hãy dùng `/login` trước.');
                }
                if (sessions.length > 1) {
                    return interaction.editReply('⚠️ Bạn có nhiều tài khoản! Vui lòng chọn tài khoản ở mục `account` khi gõ lệnh `/wallet`.');
                }
                session = sessions[0];
            }

            let tokens;
            try {
                tokens = JSON.parse(decrypt(session.encryptedCookies, session.iv));
            } catch {
                return interaction.editReply('❌ Phiên đăng nhập lỗi. Hãy dùng `/login` lại nhé.');
            }

            const { accessToken, entitlementsToken, puuid } = tokens;
            const wallet = await getWallet(accessToken, entitlementsToken, puuid);

            const embed = new EmbedBuilder()
                .setTitle(`💰 Số Dư Tài Khoản — ${session.riotUsername}`)
                .setColor('#FF4655')
                .addFields(
                    { name: `${E.vp} Valorant Points (VP)`, value: `**${wallet.vp.toLocaleString()} VP**`, inline: true },
                    { name: `${E.rp} Radianite Points (RP)`, value: `**${wallet.rp.toLocaleString()} RP**`, inline: true },
                    { name: `${E.kp} Kingdom Credits (KP)`, value: `**${wallet.kp.toLocaleString()} KP**`, inline: true }
                )
                .setFooter({ text: 'Valorant Shop Bot • Chỉ bạn mới thấy tin nhắn này' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Wallet Error:', error);
            await interaction.editReply('❌ Không lấy được số dư. Hãy thử `/login` lại nhé.');
        }
    }
};
