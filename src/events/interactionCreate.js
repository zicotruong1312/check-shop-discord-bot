const UserSession = require('../models/UserSession');
const { encrypt } = require('../utils/encryption');
const { extractTokensFromUrl, getEntitlementsAndPuuid, getPlayerName } = require('../api/riotAuth');
const { fetchAndSendShop, shopCooldown } = require('../commands/shop');
const { fetchAndSendWallet } = require('../commands/wallet');

// Deduplication: prevent the same interaction being processed twice
// (Discord retries if bot doesn't ACK within 3s — common on Render free tier)
const handledInteractions = new Set();

function dedup(interaction) {
    if (handledInteractions.has(interaction.id)) return false;
    handledInteractions.add(interaction.id);
    // Clean up after 5 minutes (interaction token TTL)
    setTimeout(() => handledInteractions.delete(interaction.id), 5 * 60 * 1000);
    return true;
}

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!dedup(interaction)) return; // Drop duplicate

        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                const errMsg = { content: '❌ Có lỗi xảy ra khi thực hiện lệnh này!', ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply(errMsg).catch(() => { });
                } else {
                    await interaction.reply(errMsg).catch(() => { });
                }
            }
        } else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                if (command.autocomplete) {
                    await command.autocomplete(interaction);
                }
            } catch (error) {
                // 40060 = interaction already acknowledged (user typed fast, Discord cancelled old autocomplete)
                // This is expected behavior — ignore silently
                if (error.code !== 40060) console.error('Autocomplete error:', error);
            }
        } else if (interaction.isButton()) {
            if (interaction.customId === 'login_btn_paste_url') {
                const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
                const modal = new ModalBuilder()
                    .setCustomId('loginModal')
                    .setTitle('Dán Link Đăng Nhập Riot');

                const urlInput = new TextInputBuilder()
                    .setCustomId('urlInput')
                    .setLabel("Dán toàn bộ Link Copy được ở đây:")
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder("https://playvalorant.com/opt_in#access_token=eyJ...")
                    .setRequired(true);

                const firstActionRow = new ActionRowBuilder().addComponents(urlInput);
                modal.addComponents(firstActionRow);

                await interaction.showModal(modal).catch(() => { });
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'loginModal') {
                const redirectUrl = interaction.fields.getTextInputValue('urlInput').trim();

                // Safely defer — if already acked somehow, skip
                try {
                    await interaction.deferReply({ ephemeral: true });
                } catch (e) {
                    console.error('deferReply failed (already acked?):', e.code);
                    return;
                }

                try {
                    // Extract Access Token
                    const { accessToken } = extractTokensFromUrl(redirectUrl);

                    // Fetch Entitlements and PUUID
                    const { entitlementsToken, puuid } = await getEntitlementsAndPuuid(accessToken);

                    // Fetch Riot Username (GameName#TagLine)
                    const riotUsername = await getPlayerName(accessToken, entitlementsToken, puuid);

                    // Bundle into JSON for encryption
                    const sessionDataJSON = JSON.stringify({ accessToken, entitlementsToken, puuid });
                    const { iv, encryptedData } = encrypt(sessionDataJSON);

                    await UserSession.findOneAndUpdate(
                        { discordId: interaction.user.id, puuid: puuid },
                        {
                            discordId: interaction.user.id,
                            puuid: puuid,
                            riotUsername: riotUsername,
                            encryptedCookies: encryptedData,
                            iv: iv,
                            updatedAt: Date.now()
                        },
                        { upsert: true, new: true }
                    );

                    await interaction.editReply({ content: `✅ Đăng nhập thành công cho tài khoản: **${riotUsername}**\n*(Lưu ý: Bạn có thể xem shop trong vòng 1 Tiếng tiếp theo. Sau 1 tiếng hãy làm lại lệnh \`/login\` này nhé).*` });
                } catch (err) {
                    console.error("Login Error: ", err);
                    await interaction.editReply({ content: `❌ Đăng nhập thất bại: ${err.message}` }).catch(() => { });
                }
            }
        } else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'shop_account_select') {
                const puuid = interaction.values[0];

                if (shopCooldown.has(interaction.user.id)) {
                    return interaction.reply({
                        content: '⏳ Vui lòng đợi 1 phút trước khi xem lại shop.',
                        ...EPHEMERAL
                    });
                }

                try {
                    await interaction.deferReply({ ...EPHEMERAL });
                } catch (e) {
                    if (!isIgnoredError(e.code)) console.error('shop_select deferReply failed:', e.code);
                    return;
                }

                try {
                    const session = await UserSession.findOne({ discordId: interaction.user.id, puuid });
                    if (!session) return interaction.editReply('❌ Không tìm thấy tài khoản. Hãy `/login` lại nhé.');
                    await fetchAndSendShop(interaction, session);
                    shopCooldown.add(interaction.user.id);
                    setTimeout(() => shopCooldown.delete(interaction.user.id), 60_000);
                } catch (err) {
                    console.error('Shop select error:', err);
                    await interaction.editReply('❌ Lỗi khi lấy shop. Token có thể hết hạn, hãy `/login` lại nhé.').catch(() => {});
                }

            } else if (interaction.customId === 'wallet_account_select') {
                const puuid = interaction.values[0];

                try {
                    await interaction.deferReply({ ...EPHEMERAL });
                } catch (e) {
                    if (!isIgnoredError(e.code)) console.error('wallet_select deferReply failed:', e.code);
                    return;
                }

                try {
                    const session = await UserSession.findOne({ discordId: interaction.user.id, puuid });
                    if (!session) return interaction.editReply('❌ Không tìm thấy tài khoản. Hãy `/login` lại nhé.');
                    await fetchAndSendWallet(interaction, session);
                } catch (err) {
                    console.error('Wallet select error:', err);
                    await interaction.editReply('❌ Lỗi khi lấy số dư. Token có thể hết hạn, hãy `/login` lại nhé.').catch(() => {});
                }
            }
        }
    },
};
