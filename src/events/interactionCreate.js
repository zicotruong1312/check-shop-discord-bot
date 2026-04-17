const UserSession = require('../models/UserSession');
const { encrypt } = require('../utils/encryption');
const { extractTokensFromUrl, getEntitlementsAndPuuid, getPlayerName } = require('../api/riotAuth');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Có lỗi xảy ra khi thực hiện lệnh này!', ephemeral: true });
            }
        } else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                if(command.autocomplete){
                    await command.autocomplete(interaction);
                }
            } catch (error) {
                console.error(error);
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

                await interaction.showModal(modal);
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'loginModal') {
                const redirectUrl = interaction.fields.getTextInputValue('urlInput').trim();

                await interaction.deferReply({ ephemeral: true });

                try {
                    // Extract Access Token
                    const { accessToken } = extractTokensFromUrl(redirectUrl);

                    // Fetch Entitlements and PUUID
                    const { entitlementsToken, puuid } = await getEntitlementsAndPuuid(accessToken);

                    // Fetch Riot Username (GameName#TagLine)
                    const riotUsername = await getPlayerName(accessToken, entitlementsToken, puuid);

                    // We bundle everything into a JSON string to keep MongoDB schema compatible
                    const sessionDataJSON = JSON.stringify({ accessToken, entitlementsToken, puuid });

                    const { iv, encryptedData } = encrypt(sessionDataJSON);

                    await UserSession.findOneAndUpdate(
                        { discordId: interaction.user.id, puuid: puuid },
                        {
                            discordId: interaction.user.id,
                            puuid: puuid,
                            riotUsername: riotUsername,
                            encryptedCookies: encryptedData, // Dùng lại tên trường cũ để khỏi phá vỡ DB
                            iv: iv,
                            updatedAt: Date.now()
                        },
                        { upsert: true, new: true }
                    );

                    await interaction.editReply({ content: `✅ Đăng nhập thành công cho tài khoản: **${riotUsername}**\n*(Lưu ý: Bạn có thể xem shop trong vòng 1 Tiếng tiếp theo. Sau 1 tiếng hãy làm lại lệnh \`/login\` này nhé).*` });
                } catch (err) {
                    console.error("Login Error: ", err);
                    await interaction.editReply({ content: `❌ Đăng nhập thất bại: ${err.message}` });
                }
            }
        }
    },
};
