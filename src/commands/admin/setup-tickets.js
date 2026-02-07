const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-tickets')
        .setDescription('Despliega el panel de tickets del servidor.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Support Center')
            .setDescription(
                'Do you need help or want to carry out a procedure?\n\n' +
                'Select the appropriate category in the menu below to open a ticket. ' +
                'Our support team will assist you as soon as possible.'
            )
            .addFields(
                { name: '`\📌 Categories\`', value: 
                    '• **Support:** General inquiries.\n' +
                    '• **Bugs:** Error reports.\n' +
                    '• **Ideas:** Suggestions for the server.\n' +
                    '• **Partners:** Alliances and collaborations.\n' +
                    '• **Shopping:** Store-related questions.\n' +
                    '• **Others:** Other matters.'
                }
            )
            .setColor('#5865F2')
            .setImage('https://i.pinimg.com/originals/57/b9/e5/57b9e5526b70cecc4558a284330e0c1d.gif') 
            .setFooter({ text: 'Automatic Ticket System', iconURL: interaction.client.user.displayAvatarURL() });

        const menu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('Select the reason for your inquiry...')
            .addOptions([
                { label: 'Support', value: 'support', emoji: '🛠️', description: 'General help' },
                { label: 'Bugs', value: 'bugs', emoji: '🐛', description: 'Report an error' },
                { label: 'Ideas', value: 'ideas', emoji: '💡', description: 'Submit a suggestion' },
                { label: 'Partners', value: 'partners', emoji: '🤝', description: 'Alliance management' },
                { label: 'Shopping', value: 'shopping', emoji: '🛒', description: 'Store-related questions' },
                { label: 'Others', value: 'others', emoji: '📂', description: 'Other matters' },
            ]);

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Panel de tickets enviado.', flags: 64 });
    },
};