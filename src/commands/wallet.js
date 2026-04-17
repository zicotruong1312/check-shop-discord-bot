const {
    SlashCommandBuilder,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    MessageFlags
} = require('discord.js');
const UserSession = require('../models/UserSession');
const { decrypt } = require('../utils/encryption');
const { getWallet } = require('../api/riotStorefront');

const EPHEMERAL = { flags: MessageFlags.Ephemeral };

const E = {
    vp: `<:vp:${process.env.EMOJI_VP}>`,
    rp: `<:rp:${process.env.EMOJI_RP}>`,
    kp: `<:kp:${process.env.EMOJI_KP}>`
};

async function fetchAndSendWallet(interaction, session) {
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
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('Xem số dư VP, Radianite và Kingdom Credits trong tài khoản Valorant'),

    async execute(interaction) {
        // Defer trước tiên để tránh 3s timeout
        try {
            await interaction.deferReply({ ...EPHEMERAL });
        } catch (e) {
            return;
        }

        try {
            const sessions = await UserSession.find({ discordId: interaction.user.id });

            if (sessions.length === 0) {
                return interaction.editReply('❌ Bạn chưa đăng nhập. Hãy dùng `/login` trước.');
            }

            // Luôn show dropdown để chọn acc
            const select = new StringSelectMenuBuilder()
                .setCustomId('wallet_account_select')
                .setPlaceholder('💰 Chọn tài khoản muốn xem số dư...')
                .addOptions(
                    sessions.map(s =>
                        new StringSelectMenuOptionBuilder()
                            .setLabel(s.riotUsername)
                            .setDescription(`PUUID: ${s.puuid.slice(0, 8)}...`)
                            .setValue(s.puuid)
                    )
                );

            const row = new ActionRowBuilder().addComponents(select);

            const embed = new EmbedBuilder()
                .setTitle('💰 Chọn Tài Khoản')
                .setDescription(
                    `Bạn có **${sessions.length} tài khoản** được liên kết.\n` +
                    `Hãy chọn tài khoản muốn xem số dư bên dưới:`
                )
                .setColor('#FF4655')
                .setFooter({ text: 'Chỉ bạn mới thấy tin nhắn này' });

            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Wallet Error:', error);
            await interaction.editReply('❌ Không lấy được dữ liệu. Hãy thử `/login` lại nhé.').catch(() => {});
        }
    },

    fetchAndSendWallet
};
