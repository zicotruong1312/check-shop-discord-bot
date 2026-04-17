require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const connectDB = require('./config/database');

connectDB();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] Lệnh tại ${filePath} thiếu thuộc tính "data" hoặc "execute".`);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

if (token && token !== 'your_discord_bot_token_here' && clientId && clientId !== 'your_discord_client_id_here') {
    const rest = new REST({ version: '10' }).setToken(token);

    (async () => {
        try {
            console.log(`Bắt đầu làm mới ${commands.length} lệnh ứng dụng (/)`);
            
            let data;
            if(process.env.GUILD_ID && process.env.GUILD_ID !== 'your_discord_guild_id_here_optional_for_guild_commands'){
               data = await rest.put(
                   Routes.applicationGuildCommands(clientId, process.env.GUILD_ID),
                   { body: commands },
               );
            } else {
               data = await rest.put(
                   Routes.applicationCommands(clientId),
                   { body: commands },
               );
            }

            console.log(`Đã tải lại thành công ${data.length} lệnh ứng dụng (/).`);
        } catch (error) {
            console.error("Lỗi đăng ký lệnh:", error);
        }
    })();
    
    // Start Express Server
    require('./server');

    // Start cron jobs
    require('./jobs/shopHunterJob')(client);
    require('./jobs/shopReminderJob')(client);

    client.login(token);
} else {
    console.log("CHÚ Ý: Chưa cấu hình BOT_TOKEN hoặc CLIENT_ID trong file .env");
}
