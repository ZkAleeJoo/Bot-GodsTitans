const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-roles')
        .setDescription('Despliega el panel estético de gestión de roles.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channelId = '1460372642765738268'; 
        const channel = interaction.client.channels.cache.get(channelId);

        if (!channel) return interaction.reply({ content: 'No se pudo localizar el canal.', flags: 64});

        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: 'NOTIFICATION CENTER', 
                iconURL: interaction.guild.iconURL() 
            })
            .setTitle('〉Preferences Settings')
            .setDescription(
                'Customize your experience on the server by enabling the notifications you wish to receive. ' +
                'This will prevent unnecessary mentions and only notify you of what you choose.'
            )
            .addFields(
                { name: '〉 Available', value: 
                    '```\n' +
                    '• Update      • Giveaways\n' +
                    '• Dead Chat   • Offers\n' +
                    '• BlackList\n' +
                    '```', inline: false 
                },
                { name: '〉 How does it work?', value: '> Select the options in the menu below. You can choose several at once or remove them if you no longer want them.', inline: false }
            )
            .setColor('#2b2d31') 
            .setImage('https://i.pinimg.com/originals/57/b9/e5/57b9e5526b70cecc4558a284330e0c1d.gif') 
            .setFooter({ text: 'Autonomous Management System', iconURL: interaction.client.user.displayAvatarURL() });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('autorole_menu')
            .setPlaceholder('Click here to manage your roles...')
            .setMinValues(0) 
            .setMaxValues(5) 
            .addOptions([
                { label: 'Update', value: '1460373287338246392', description: 'Plugin and version updates.', emoji: '1448307029948108820' },
                { label: 'Giveaways', value: '1460373363431047250', description: 'Event notifications and awards.', emoji: '1448307028022919302' },
                { label: 'Dead Chat', value: '1460373389993709740', description: 'Help us revive the server!', emoji: '1448307031873290240' },
                { label: 'Offers', value: '1460373427113300028', description: 'Special promotions and discounts.', emoji: '1448307047409127484' },
                { label: 'BlackList', value: '1460373461452063004', description: 'Information about security and bans.', emoji: '1448307037753835723' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Panel desplegado con éxito.', flags: 64});
    },
};