const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Respond with Pong! and latency.'),
    
    async execute(interaction) {
        await interaction.reply(`Latency: ${Date.now() - interaction.createdTimestamp}ms`);
    },
};