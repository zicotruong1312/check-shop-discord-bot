const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserSession = require('../models/UserSession');
const { decrypt } = require('../utils/encryption');
const { getStorefront, getWallet, getSkinDetails } = require('../api/riotStorefront');

const shopCooldown = new Set();

// Application emoji helpers (uploaded via setup_emojis.js)
const E = {
    vp: `<:vp:${process.env.EMOJI_VP}>`,
    rp: `<:rp:${process.env.EMOJI_RP}>`,
    kp: `<:kp:${process.env.EMOJI_KP}>`
};

// Skin tier color by VP price
function getTierColor(price) {
    if (price <= 875)  return '#009bde'; // Select   — teal
    if (price <= 1275) return '#4b9bcb'; // Deluxe   — blue
    if (price <= 1775) return '#d44b9c'; // Premium  — pink
    return '#f5a623';                    // Ultra+   — gold
}

// Hours until next 00:00 UTC store reset
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Xem cửa hàng Valorant hàng ngày')
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
        if (shopCooldown.has(interaction.user.id)) {
            return interaction.reply({
                content: '⏳ Vui lòng đợi 1 phút trước khi xem lại shop.',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            // 1. Load session
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
                    return interaction.editReply('❌ Bạn chưa đăng nhập. Hãy dùng lệnh `/login` trước.');
                }
                if (sessions.length > 1) {
                    return interaction.editReply('⚠️ Bạn có nhiều tài khoản! Vui lòng chọn tài khoản muốn xem ở mục `account` khi gõ lệnh `/shop`.');
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

            // 2. Fetch storefront + wallet in parallel
            const [{ skinIds, priceMap }, wallet] = await Promise.all([
                getStorefront(accessToken, entitlementsToken, puuid),
                getWallet(accessToken, entitlementsToken, puuid)
            ]);

            // Update lastShopCheck
            session.lastShopCheck = Date.now();
            await session.save().catch(e => console.error("Lỗi save lastShopCheck:", e));

            // 3. Fetch skin details (English names)
            const skins = await getSkinDetails(skinIds, priceMap);

            const embeds = [];

            // ── Header embed ──────────────────────────────────────────
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

            // ── One embed per skin (unique URL per skin = same display width) ──
            for (const skin of skins) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Valorant Shop', iconURL: VALORANT_ICON })
                    .setURL(`https://playvalorant.com/skin/${skin.id}`)
                    .setTitle(skin.name)
                    .setDescription(`${E.vp} **${skin.price.toLocaleString()} VP**`)
                    .addFields({ name: '\u200b', value: '\u200b' })
                    .setColor(getTierColor(skin.price))
                    .setFooter({ text: 'Valorant Shop Bot' });

                if (skin.icon) embed.setThumbnail(skin.icon);
                embeds.push(embed);
            }

            await interaction.editReply({ embeds });

            // Cooldown 1 phút
            shopCooldown.add(interaction.user.id);
            setTimeout(() => shopCooldown.delete(interaction.user.id), 60_000);

        } catch (error) {
            console.error('Shop Error:', error);
            const msg = error.message || 'Lỗi không xác định';
            const hint = msg.includes('404')
                ? '\n\n⚠️ Hãy `/login` lại và copy link từ trang **localhost**.'
                : '\nToken có thể hết hạn (1h), hãy `/login` lại.';
            await interaction.editReply(`❌ ${msg}${hint}`);
        }
    }
};
