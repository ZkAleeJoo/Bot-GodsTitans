const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-roles')
        .setDescription('Despliega el panel estético de gestión de roles.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channelId = '1469740395029074124'; 
        const channel = interaction.client.channels.cache.get(channelId);

        if (!channel) return interaction.reply({ content: 'No se pudo localizar el canal.', flags: 64});

        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: 'CENTRO DE NOTIFICACIONES', 
                iconURL: interaction.guild.iconURL() 
            })
            .setTitle('〉Configuración de Preferencias')
            .setDescription(
                'Personaliza tu experiencia en el servidor habilitando las notificaciones que deseas recibir. ' +
                'Esto evitará menciones innecesarias y solo te notificará sobre lo que elijas.'
            )
            .addFields(
                { name: '〉 Disponibles', value: 
                    '```\n' +
                    '• Actualización  • Sorteos\n' +
                    '• Chat Muerto   • Ofertas\n' +
                    '• Lista Negra\n' +
                    '```', inline: false 
                },
                { name: '〉 ¿Cómo funciona?', value: '> Selecciona las opciones en el menú a continuación. Puedes elegir varias a la vez o eliminarlas si ya no las deseas.', inline: false }
            )
            .setColor('#2b2d31') 
            .setImage('https://i.pinimg.com/originals/57/b9/e5/57b9e5526b70cecc4558a284330e0c1d.gif') 
            .setFooter({ text: 'Sistema de Gestión Autónoma', iconURL: interaction.client.user.displayAvatarURL() });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('autorole_menu')
            .setPlaceholder('Haz clic aquí para gestionar tus roles...')
            .setMinValues(0) 
            .setMaxValues(5) 
            .addOptions([
                { label: 'Actualización', value: '1469730697760735346', description: 'Notificaciones de plugins y versiones.', emoji: '1448307029948108820' },
                { label: 'Sorteos', value: '1469730755214315655', description: 'Notificaciones de eventos y premios.', emoji: '1448307028022919302' },
                { label: 'Chat Muerto', value: '1469730781755736146', description: '¡Ayúdanos a revivir el servidor!', emoji: '1448307031873290240' },
                { label: 'Ofertas', value: '1469730813036859613', description: 'Promociones y descuentos especiales.', emoji: '1448307047409127484' },
                { label: 'Lista Negra', value: '1469730837892432087', description: 'Información sobre seguridad y prohibiciones.', emoji: '1448307037753835723' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Panel desplegado con éxito.', flags: 64});
    },
};