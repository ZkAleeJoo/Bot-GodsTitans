const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sugerir')
        .setDescription('Open a professional form to send a suggestion.'),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('suggestion_modal')
            .setTitle('💡 New Suggestion');

        const pluginInput = new TextInputBuilder()
            .setCustomId('suggest_plugin')
            .setLabel("What plugin is the idea for?")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Examples: MaxStaff, ClearLag+...')
            .setRequired(true);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('suggest_description')
            .setLabel("Describe your suggestion")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Explain in detail what you would like to add or change...')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(pluginInput),
            new ActionRowBuilder().addComponents(descriptionInput)
        );

        await interaction.showModal(modal);
    },
};