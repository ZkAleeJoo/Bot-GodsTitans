const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js'); //

const MIS_PLUGINS = [
    { 
        name: 'MaxStaff', 
        value: 'maxstaff', 
        url: 'https://modrinth.com/plugin/maxstaff', 
        thumbnail: 'https://www.spigotmc.org/data/resource_icons/130/130851.jpg?1766411128', 
        color: '#44ff00' 
    },
    { 
        name: 'ClearLag+', 
        value: 'clearlag', 
        url: 'https://modrinth.com/plugin/clearlag+', 
        thumbnail: 'https://www.spigotmc.org/data/resource_icons/122/122239.jpg?1765979700',
        color: '#44ff00' 
    },
]; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Anuncia la actualización de un plugin en Modrinth.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('plugin')
                .setDescription('El plugin que se actualizó')
                .setRequired(true)
                .addChoices(
                    ...MIS_PLUGINS.map(p => ({ name: p.name, value: p.value }))
                ))
        .addStringOption(option =>
            option.setName('version')
                .setDescription('La nueva versión (ej: v2.5.0)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('descripcion')
                .setDescription('Describe los cambios (puedes usar \\n para saltos de línea)')
                .setRequired(true)),

    async execute(interaction) {
        const pluginValue = interaction.options.getString('plugin');
        const version = interaction.options.getString('version');
        const rawChanges = interaction.options.getString('descripcion');
        const changes = rawChanges.replace(/\\n/g, '\n');

        const pluginData = MIS_PLUGINS.find(p => p.value === pluginValue);
        const channelId = process.env.UPDATE_CHANNEL_ID;
        const announcementChannel = interaction.client.channels.cache.get(channelId);

        if (!announcementChannel) {
            return interaction.reply({ 
                content: `❌ **Error:** No encontré el canal de actualizaciones.`, 
                flags: 64
            });
        }

        const announcementEmbed = new EmbedBuilder()
            .setTitle(`Update ${pluginData.name}`)
            .setColor(pluginData.color)
            .setThumbnail(pluginData.thumbnail || interaction.client.user.displayAvatarURL())
            .addFields(
                { name: '📦 New version', value: `\`${version}\``, inline: true },
                { name: '📝 New Features and Changes', value: changes } 
            )
            .setTimestamp()
            .setFooter({ 
                text: `Published on Modrinth`, 
                iconURL: "https://dl.flathub.org/media/com/modrinth/ModrinthApp/bff25765a432419ad3bc1a76ebd34f77/icons/128x128@2/com.modrinth.ModrinthApp.png" 
            });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Download Link')
                .setURL(pluginData.url)
                .setStyle(ButtonStyle.Link)
        );

        try {
            await announcementChannel.send({ 
                content: '> `|` <@&1460373287338246392>', 
                embeds: [announcementEmbed], 
                components: [row] 
            });

            await interaction.reply({ 
                content: `✅ Anuncio de **${pluginData.name}** enviado a <#${channelId}>.`, 
                flags: 64
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: '❌ Error al enviar el anuncio. Revisa los permisos.', 
                flags: 64
            });
        }
    },
};