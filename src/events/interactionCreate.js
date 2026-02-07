const { 
    Events, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle 
} = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction) {
            // --- MANEJO DE COMANDOS ---
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);
                if (!command) return;

                try { 
                    await command.execute(interaction); 
                } catch (error) { 
                    console.error(error);

                    const logChannel = interaction.client.channels.cache.get(process.env.LOG_CHANNEL_ID);
                    if (logChannel) {
                        const errorEmbed = new EmbedBuilder()
                            .setTitle('❌ Error en Comando')
                            .setColor('#ff4757')
                            .addFields(
                                { name: '💻 Comando', value: `\`/${interaction.commandName}\``, inline: true },
                                { name: '👤 Usuario', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                                { name: '📂 Error', value: `\`\`\`js\n${error.message || error}\n\`\`\`` }
                            )
                            .setTimestamp();

                        await logChannel.send({ embeds: [errorEmbed] });
                    }

                    const replyContent = '❌ Hubo un error al ejecutar este comando';
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: replyContent, flags: 64 });
                    } else {
                        await interaction.reply({ content: replyContent, flags: 64 });
                    }
                }
            }

        // --- SISTEMA DE AUTOROLES ---
        if (interaction.isStringSelectMenu() && interaction.customId === 'autorole_menu') {
            const selectedRoles = interaction.values; 
            const allAutoroles = [
                '1469730697760735346', '1469730755214315655', 
                '1469730781755736146', '1469730813036859613', 
                '1469730837892432087'
            ];

            try {
                const member = interaction.member;
                const currentRoles = member.roles.cache.map(r => r.id);
                
                const otherRoles = currentRoles.filter(id => !allAutoroles.includes(id));
                
                const finalRoles = [...otherRoles, ...selectedRoles];

                await member.roles.set(finalRoles);

                await interaction.reply({ 
                    content: 'Tus roles fueron actualizados correctamente.', 
                    flags: 64
                });
            } catch (error) {
                console.error('Error en Autoroles:', error);
                await interaction.reply({ 
                    content: 'Error de permisos al actualizar tus roles. Por favor, contacta a un administrador.', 
                    flags: 64
                });
            }
        }


        // --- SISTEMA DE TICKETS: APERTURA ---
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
            await interaction.deferReply({ flags: 64 }); 

            const categoryId = process.env.TICKET_CATEGORY_ID;
            const supportRoleId = process.env.SUPPORT_ROLE_ID;
            const category = interaction.guild.channels.cache.get(categoryId);

            if (!category) {
            return interaction.editReply({ content: '❌ Error: La categoría de tickets no está configurada correctamente.' });
            }

            const ticketCount = category.children.cache.size + 1;
            const categoryName = interaction.values[0];
            const channelName = `${ticketCount}-${categoryName}-${interaction.user.username}`;

            try {
            const ticketChannel = await interaction.guild.channels.create({
                name: channelName,
                type: 0, 
                parent: categoryId,
                permissionOverwrites: [
                { id: interaction.guild.id, deny: ['ViewChannel'] }, 
                { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                { id: supportRoleId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                ],
            });

            const welcomeEmbed = new EmbedBuilder()
                .setTitle('〉TICKET ABIERTO')
                .setColor('#5865F2')
                .setDescription(
                `Hola ${interaction.user}, gracias por contactarnos.\n` +
                'Un agente de nuestro **Equipo de Soporte** estará contigo en breve. ' +
                'Por favor explica tu caso en detalle para acelerar el proceso.'
                )
                .addFields(
                { name: '👤 Usuario', value: `${interaction.user.tag}`, inline: true },
                { name: '📂 Categoría', value: `\`${categoryName.toUpperCase()}\``, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Sistema de Tickets Gengar', iconURL: interaction.client.user.displayAvatarURL() });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                .setCustomId('claim_ticket')
                .setLabel('Reclamar Ticket')
                .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Cerrar Ticket')
                .setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({ 
                content: `> Atención: ${interaction.user} | <@&${supportRoleId}>`, 
                embeds: [welcomeEmbed], 
                components: [row] 
            });

            await interaction.editReply({ content: `✅ Ticket creado exitosamente: ${ticketChannel}` });

            } catch (error) {
            console.error('Error al crear ticket:', error);
            await interaction.editReply({ content: '❌ Hubo un error al crear tu canal de soporte.' });
            }
        }


        // --- SISTEMA DE TICKETS: RECLAMAR (CLAIM) ---
        if (interaction.isButton() && interaction.customId === 'claim_ticket') {
            const supportRoleId = process.env.SUPPORT_ROLE_ID;

            if (!interaction.member.roles.cache.has(supportRoleId)) {
            return interaction.reply({ 
                content: '❌ Solo los miembros del equipo de soporte pueden reclamar tickets.', 
                flags: 64 
            });
            }

            const oldEmbed = interaction.message.embeds[0];
            const claimedEmbed = EmbedBuilder.from(oldEmbed)
            .setColor('#2ecc71') 
            .addFields({ name: '🙋‍♂️ Reclamado por', value: `${interaction.user}`, inline: true });

            const row = ActionRowBuilder.from(interaction.message.components[0]);
            row.components[0].setDisabled(true); 
            
            await interaction.update({ embeds: [claimedEmbed], components: [row] });
            await interaction.followUp({ 
            content: `✅ Este ticket ahora está siendo atendido por ${interaction.user}.`, 
            flags: 64 
            });
        }



        // --- SISTEMA DE TICKETS: CIERRE Y TRANSCRIPCIÓN ---
        if (interaction.isButton() && interaction.customId === 'close_ticket') {

            const supportRoleId = process.env.SUPPORT_ROLE_ID;

            if (!interaction.member.roles.cache.has(supportRoleId)) {
            return interaction.reply({ 
                content: '❌ Solo los miembros del equipo de soporte pueden cerrar tickets.', 
                flags: 64 
            });
            }

            
            await interaction.reply({ content: '🔒 Cerrando ticket y generando transcripción...', flags: 64 });

            const channel = interaction.channel;
            const logChannel = interaction.client.channels.cache.get(process.env.TICKET_LOG_CHANNEL_ID);
            
            const ticketOwner = channel.permissionOverwrites.cache.find(po => po.type === 1 && po.id !== process.env.SUPPORT_ROLE_ID)?.id;
            const user = await interaction.client.users.fetch(ticketOwner).catch(() => null);

            const transcript = await discordTranscripts.createTranscript(channel, {
            limit: -1,
            fileName: `transcript-${channel.name}.html`,
            returnType: 'attachment',
            saveImages: true,
            poweredBy: false
            });

            if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('📄 Transcripción del Ticket Guardada')
                .setColor('#2f3136')
                .addFields(
                { name: 'Canal', value: `\`${channel.name}\``, inline: true },
                { name: 'Abierto por', value: user ? `${user.tag}` : 'Desconocido', inline: true }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed], files: [transcript] });
            }

            if (user) {
            const ratingEmbed = new EmbedBuilder()
                .setTitle('⭐ Valora nuestro Soporte')
                .setDescription('¡Esperamos haberte ayudado! Por favor valora la atención recibida de nuestro equipo.')
                .setColor('#f1c40f')
                .setFooter({ text: 'Tu comentario nos ayuda a mejorar.' });

            const ratingRow = new ActionRowBuilder().addComponents(
                [1, 2, 3, 4, 5].map(star => 
                new ButtonBuilder()
                    .setCustomId(`rate_${star}_${channel.name}`) 
                    .setLabel(`${star} ⭐`)
                    .setStyle(ButtonStyle.Secondary)
                )
            );

            try {
                await user.send({ 
                content: '📎 Aquí está una copia de la transcripción de tu ticket:',
                embeds: [ratingEmbed], 
                components: [ratingRow],
                files: [transcript] 
                });
            } catch (e) {
                console.log(`No se pudo enviar el DM a ${user.tag}`);
            }
            }

            setTimeout(() => channel.delete().catch(() => {}), 5000);
        }

            // --- SISTEMA DE VALORACIONES (ESTRELLAS) ---
            if (interaction.isButton() && interaction.customId.startsWith('rate_')) {
                const [ , stars, ticketName] = interaction.customId.split('_');
                const ratingsChannel = interaction.client.channels.cache.get(process.env.RATINGS_CHANNEL_ID);

                if (ratingsChannel) {
                const feedbackEmbed = new EmbedBuilder()
                    .setTitle('🌟 Nueva Valoración Recibida')
                    .setColor('#a55eea')
                    .addFields(
                    { name: 'Usuario', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Ticket', value: `\`${ticketName}\``, inline: true },
                    { name: 'Valoración', value: '⭐'.repeat(parseInt(stars)), inline: false }
                    )
                    .setTimestamp();

                await ratingsChannel.send({ embeds: [feedbackEmbed] });
                }

                await interaction.update({ 
                content: '✅ ¡Gracias por tu valoración!', 
                embeds: [], 
                components: [] 
                });
            }


















    },
};