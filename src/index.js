const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ] 
});

client.commands = new Collection();

// --- CARGADOR DE COMANDOS ---
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[ADVERTENCIA] El comando en ${filePath} falta "data" o "execute".`);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    // --- CARGADOR DE EVENTOS ---
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(process.env.TOKEN);

// --- SISTEMA ANTI-CRASH---
const sendErrorLog = (title, error) => {
    const logChannel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle(`⚠️ ${title}`)
        .setColor('#ffa502')
        .setDescription(`\`\`\`js\n${error.stack || error}\n\`\`\``)
        .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
};

process.on('unhandledRejection', (reason, p) => {
    console.log(' [Anti-Crash] :: Unhandled Rejection');
    console.log(reason, p);
    sendErrorLog('Unhandled Rejection (Promesa no capturada)', reason);
});

process.on('uncaughtException', (err, origin) => {
    console.log(' [Anti-Crash] :: Uncaught Exception');
    console.log(err, origin);
    sendErrorLog('Uncaught Exception (Error crítico)', err);
});