const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-tickets')
        .setDescription('Despliega el panel de tickets del servidor.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Centro de Soporte')
            .setDescription(
                '¿Necesitas ayuda o quieres realizar un trámite?\n\n' +
                'Selecciona la categoría apropiada en el menú a continuación para abrir un ticket. ' +
                'Nuestro equipo de soporte te asistirá lo antes posible.'
            )
            .addFields(
                { name: '`\📌 Categorías\`', value: 
                    '• **Soporte:** Consultas generales.\n' +
                    '• **Errores:** Reportes de fallos.\n' +
                    '• **Reportes:** Sugerencias para el servidor.\n' +
                    '• **Alianzas:** Alianzas y colaboraciones.\n' +
                    '• **Compras:** Preguntas relacionadas con la tienda.\n' +
                    '• **Otros:** Otros asuntos.'
                }
            )
            .setColor('#5865F2')
            .setImage('https://i.pinimg.com/originals/57/b9/e5/57b9e5526b70cecc4558a284330e0c1d.gif') 
            .setFooter({ text: 'Sistema Automático de Tickets', iconURL: interaction.client.user.displayAvatarURL() });

        const menu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('Selecciona el motivo de tu consulta...')
            .addOptions([
                { label: 'Soporte', value: 'support', emoji: '🛠️', description: 'Ayuda general' },
                { label: 'Errores', value: 'bugs', emoji: '🐛', description: 'Reportar un error' },
                { label: 'Reportes', value: 'reportes', emoji: '🔍', description: 'Enviar una sugerencia' },
                { label: 'Alianzas', value: 'partners', emoji: '🤝', description: 'Gestión de alianzas' },
                { label: 'Compras', value: 'shopping', emoji: '🛒', description: 'Preguntas sobre la tienda' },
                { label: 'Otros', value: 'others', emoji: '📂', description: 'Otros asuntos' },
            ]);

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Panel de tickets enviado.', flags: 64 });
    },
};