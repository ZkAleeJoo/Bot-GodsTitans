const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../utils/levelingService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Muestra la clasificación de niveles del servidor.')
        .addIntegerOption((option) =>
            option
                .setName('top')
                .setDescription('Cantidad de usuarios a mostrar (1-25)')
                .setMinValue(1)
                .setMaxValue(25)
                .setRequired(false),
        ),

    async execute(interaction) {
        const top = interaction.options.getInteger('top') || 10;
        const ranking = getLeaderboard(interaction.guild.id, top);

        if (!ranking.length) {
            return interaction.reply({ content: 'Todavía no hay datos de nivel para mostrar.', flags: 64 });
        }

        const lines = ranking.map((entry, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            const user = interaction.client.users.cache.get(entry.userId);
            const name = user ? user.tag : `<@${entry.userId}>`;
            return `${medal} **${name}** · Nivel **${entry.level}** · XP total **${entry.totalXp}**`;
        });

        const embed = new EmbedBuilder()
            .setTitle('🏆 Leaderboard de Niveles')
            .setColor('#f1c40f')
            .setDescription(lines.join('\n'))
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};