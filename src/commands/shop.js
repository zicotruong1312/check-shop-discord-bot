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
const { getStorefront, getWallet, getSkinDetails } = require('../api/riotStorefront');

const EPHEMERAL = { flags: MessageFlags.Ephemeral };
const shopCooldown = new Set();

// Application emoji helpers
const E = {
    vp: `<:vp:${process.env.EMOJI_VP}>`,
    rp: `<:rp:${process.env.EMOJI_RP}>`,
    kp: `<:kp:${process.env.EMOJI_KP}>`
};

function getTierColor(price) {
    if (price <= 875)  return '#009bde';
    if (price <= 1275) return '#4b9bcb';
    if (price <= 1775) return '#d44b9c';
    return '#f5a623';
}

function getHoursUntilReset() {
    const now = new Date();
    const nextReset = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1
    ));
    const ms = nextReset - now;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
}

const VALORANT_ICON = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Valorant_logo_-_pink.svg/600px-Valorant_logo_-_pink.svg.png';
const SHOP_URL = 'https://playvalorant.com';

// ─────────────────────────────────────────────────────────────
// Shared: fetch + build embeds for a given session
// interaction must already be deferred (ephemeral) before calling
// ─────────────────────────────────────────────────────────────
async function fetchAndSendShop(interaction, session) {
    let tokens;
    try {
        tokens = JSON.parse(decrypt(session.encryptedCookies, session.iv));
    } catch {
        return interaction.editReply('❌ Phiên đăng nhập lỗi. Hãy dùng `/login` lại nhé.');
    }

    const { accessToken, entitlementsToken, puuid } = tokens;

    const [{ skinIds, priceMap }, wallet] = await Promise.all([
        getStorefront(accessToken, entitlementsToken, puuid),
        getWallet(accessToken, entitlementsToken, puuid)
    ]);

    session.lastShopCheck = Date.now();
    await session.save().catch(e => console.error('Lỗi save lastShopCheck:', e));

    const skins = await getSkinDetails(skinIds, priceMap);
    const embeds = [];

    // Header embed
    embeds.push(
        new EmbedBuilder()
            .setAuthor({ name: 'Valorant Shop', iconURL: VALORANT_ICON })
            .setURL(SHOP_URL)
            .setTitle(`🛒 Daily Store — ${session.riotUsername}`)
            .setDescription(`🔄 Resets in **${getHoursUntilReset()}**`)
            .addFields(
                { name: `${E.vp} Valorant Points`, value: `**${wallet.vp.toLocaleString()} VP**`, inline: true },
                { name: `${E.rp} Radianite Points`, value: `**${wallet.rp.toLocaleString()} RP**`, inline: true },
                { name: `${E.kp} Kingdom Credits`, value: `**${wallet.kp.toLocaleString()} KP**`, inline: true }
            )
            .setColor('#FF4655')
            .setTimestamp()
    );

    // One embed per skin
    for (const skin of skins) {
        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Valorant Shop', iconURL: VALORANT_ICON })
            .setURL(`https://playvalorant.com/skin/${skin.id}`)
            .setTitle(skin.name)
            .setDescription(`${E.vp} **${skin.price.toLocaleString()} VP**`)
            .addFields({ name: '\u200b', value: '\u200b' })
            .setColor(getTierColor(skin.price))
            .setFooter({ text: 'Valorant Shop Bot • Chỉ bạn mới thấy tin nhắn này' });

        if (skin.icon) embed.setThumbnail(skin.icon);
        embeds.push(embed);
    }

    await interaction.editReply({ embeds, components: [] });
}

// ─────────────────────────────────────────────────────────────
// Show account picker select menu (ephemeral)
// ─────────────────────────────────────────────────────────────
async function showAccountPicker(interaction, sessions) {
    const select = new StringSelectMenuBuilder()
        .setCustomId('shop_account_select')
        .setPlaceholder('🎮 Chọn tài khoản muốn xem shop...')
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
        .setTitle('🛒 Chọn Tài Khoản')
        .setDescription(
            `Bạn có **${sessions.length} tài khoản** được liên kết.\n` +
            `Hãy chọn tài khoản muốn xem shop bên dưới:`
        )
        .setColor('#FF4655')
        .setFooter({ text: 'Chỉ bạn mới thấy tin nhắn này' });

    await interaction.reply({ embeds: [embed], components: [row], ...EPHEMERAL });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Xem cửa hàng Valorant hàng ngày'),

    async execute(interaction) {
        if (shopCooldown.has(interaction.user.id)) {
            return interaction.reply({
                content: '⏳ Vui lòng đợi 1 phút trước khi xem lại shop.',
                ...EPHEMERAL
            });
        }

        try {
            const sessions = await UserSession.find({ discordId: interaction.user.id });

            if (sessions.length === 0) {
                return interaction.reply({
                    content: '❌ Bạn chưa đăng nhập. Hãy dùng lệnh `/login` trước.',
                    ...EPHEMERAL
                });
            }

            // Luôn show dropdown để user chọn acc
            await showAccountPicker(interaction, sessions);
            return; // cooldown set sau khi user chọn

            // Cooldown 1 phút
            shopCooldown.add(interaction.user.id);
            setTimeout(() => shopCooldown.delete(interaction.user.id), 60_000);

        } catch (error) {
            console.error('Shop Error:', error);
            const msg = error.message || 'Lỗi không xác định';
            const hint = msg.includes('404')
                ? '\n\n⚠️ Hãy `/login` lại và copy link từ trang **localhost**.'
                : '\nToken có thể hết hạn (1h), hãy `/login` lại.';
            const errText = `❌ ${msg}${hint}`;
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(errText).catch(() => {});
            } else {
                await interaction.reply({ content: errText, ...EPHEMERAL }).catch(() => {});
            }
        }
    },

    // Expose for use in interactionCreate
    fetchAndSendShop,
    shopCooldown
};
