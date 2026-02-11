const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserStats, getGuildConfig, xpNeededForLevel } = require('../../utils/levelingService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Muestra tu nivel o el de otro usuario.')
        .addUserOption((option) =>
            option
                .setName('usuario')
                .setDescription('Usuario a consultar')
                .setRequired(false),
        ),

    async execute(interaction) {
        const target = interaction.options.getUser('usuario') || interaction.user;
        const stats = getUserStats(interaction.guild.id, target.id);
        const config = getGuildConfig(interaction.guild.id);
        const xpNext = xpNeededForLevel(stats.level + 1, config);

        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setAuthor({ name: `Rango de ${target.tag}`, iconURL: target.displayAvatarURL() })
            .addFields(
                { name: 'Nivel', value: `\`${stats.level}\``, inline: true },
                { name: 'XP actual', value: `\`${stats.xp}\``, inline: true },
                { name: 'XP siguiente nivel', value: `\`${xpNext}\``, inline: true },
                { name: 'XP total', value: `\`${stats.totalXp}\`` },
            )

        await interaction.reply({ embeds: [embed] });
    },
};