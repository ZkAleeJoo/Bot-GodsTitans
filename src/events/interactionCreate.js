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
                '1460373287338246392', '1460373363431047250', 
                '1460373389993709740', '1460373427113300028', 
                '1460373461452063004'
            ];

            try {
                const member = interaction.member;
                const currentRoles = member.roles.cache.map(r => r.id);
                
                const otherRoles = currentRoles.filter(id => !allAutoroles.includes(id));
                
                const finalRoles = [...otherRoles, ...selectedRoles];

                await member.roles.set(finalRoles);

                await interaction.reply({ 
                    content: 'Your preferences have been successfully updated.', 
                    flags: 64
                });
            } catch (error) {
                console.error('Error en Autoroles:', error);
                await interaction.reply({ 
                    content: 'Permission error when updating your roles. Please contact an administrator.', 
                    flags: 64
                });
            }
        }

        // --- SISTEMA DE SUGERENCIAS: RECEPCIÓN DEL MODAL ---
        if (interaction.isModalSubmit() && interaction.customId === 'suggestion_modal') {
            const plugin = interaction.fields.getTextInputValue('suggest_plugin');
            const description = interaction.fields.getTextInputValue('suggest_description');
            
            const suggestChannel = interaction.client.channels.cache.get(process.env.SUGGESTIONS_CHANNEL_ID);
            if (!suggestChannel) return interaction.reply({ content: '❌ Error: Channel not configured.', flags: 64 });

            const embed = new EmbedBuilder()
                .setTitle('➤   NEW SUGGESTION')
                .setColor('#f1c40f')
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                .addFields(
                    { name: '🔌 Plugin', value: `\`${plugin}\``, inline: true },
                    { name: '📝 Proposal', value: `\`\`\`yaml\n${description || 'No description'}\n\`\`\`` }
                )
                .setFooter({ text: `ID Usuario: ${interaction.user.id}` })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('approve_suggestion').setLabel('Aprobar').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('reject_suggestion').setLabel('Rechazar').setStyle(ButtonStyle.Danger)
            );

            await suggestChannel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: '✅ Your suggestion has been sent for review!', flags: 64 });
        }

        // --- SISTEMA DE GESTIÓN DE SUGERENCIAS (ADMIN ONLY) ---
        if (interaction.isButton() && (interaction.customId === 'approve_suggestion' || interaction.customId === 'reject_suggestion')) {
            if (interaction.user.id !== '737357479364526143') {
                return interaction.reply({ 
                    content: '❌ You do not have permission to manage suggestions.', 
                    flags: 64 
                });
            }

            const isApprove = interaction.customId === 'approve_suggestion';
            
            const modal = new ModalBuilder()
                .setCustomId(isApprove ? 'modal_approve_reason' : 'modal_reject_reason')
                .setTitle(isApprove ? 'Aprobar Sugerencia' : 'Rechazar Sugerencia');

            const reasonInput = new TextInputBuilder()
                .setCustomId('reason_text')
                .setLabel(isApprove ? "Reason for approval" : "Reason for rejection")
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Write here why you made this decision...')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));

            await interaction.showModal(modal);
        }

        // --- PROCESAR EL MOTIVO DE LA SUGERENCIA ---
        if (interaction.isModalSubmit() && (interaction.customId === 'modal_approve_reason' || interaction.customId === 'modal_reject_reason')) {
            const reason = interaction.fields.getTextInputValue('reason_text');
            const isApprove = interaction.customId === 'modal_approve_reason';

            const message = interaction.message;
            const oldEmbed = message.embeds[0];
            if (!oldEmbed) return;

            const updatedEmbed = EmbedBuilder.from(oldEmbed)
                .setTitle(isApprove ? '✅ SUGGESTION APPROVED' : '❌ SUGGESTION REJECTED')
                .setColor(isApprove ? '#2ecc71' : '#e74c3c')
                .addFields({ name: '💬 Reason from Administration', value: `\`\`\`\n${reason}\n\`\`\`` })
                .setTimestamp();

            await message.edit({ embeds: [updatedEmbed], components: [] });

            await interaction.reply({ 
                content: `✅ Suggestion processed successfully as **${isApprove ? 'Approved' : 'Rejected'}**.`, 
                flags: 64 
            });
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
                    .setTitle('〉TICKET OPENED')
                    .setColor('#5865F2')
                    .setDescription(
                        `Hello ${interaction.user}, thanks for contacting us.\n` +
                        'An agent from our **Support Team** will be with you shortly. ' +
                        'Please explain your case in detail to speed up the process.'
                    )
                    .addFields(
                        { name: '👤 User', value: `${interaction.user.tag}`, inline: true },
                        { name: '📂 Category', value: `\`${categoryName.toUpperCase()}\``, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Gengar Ticket System', iconURL: interaction.client.user.displayAvatarURL() });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('claim_ticket')
                        .setLabel('Claim Ticket')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('Close Ticket')
                        .setStyle(ButtonStyle.Danger)
                );

                await ticketChannel.send({ 
                    content: `> Attention: ${interaction.user} | <@&${supportRoleId}>`, 
                    embeds: [welcomeEmbed], 
                    components: [row] 
                });

                await interaction.editReply({ content: `✅ Ticket created successfully: ${ticketChannel}` });

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
                    content: '❌ Only members of the support team can claim tickets.', 
                    flags: 64 
                });
            }

            const oldEmbed = interaction.message.embeds[0];
            const claimedEmbed = EmbedBuilder.from(oldEmbed)
                .setColor('#2ecc71') 
                .addFields({ name: '🙋‍♂️ Claimed by', value: `${interaction.user}`, inline: true });

            const row = ActionRowBuilder.from(interaction.message.components[0]);
            row.components[0].setDisabled(true); 
            
            await interaction.update({ embeds: [claimedEmbed], components: [row] });
            await interaction.followUp({ 
                content: `✅ This ticket is now being attended by ${interaction.user}.`, 
                flags: 64 
            });
        }



        // --- SISTEMA DE TICKETS: CIERRE Y TRANSCRIPCIÓN ---
        if (interaction.isButton() && interaction.customId === 'close_ticket') {

            const supportRoleId = process.env.SUPPORT_ROLE_ID;

            if (!interaction.member.roles.cache.has(supportRoleId)) {
                return interaction.reply({ 
                    content: '❌ Only members of the support team can claim tickets.', 
                    flags: 64 
                });
            }

            
            await interaction.reply({ content: '🔒 Closing ticket and generating transcript...', flags: 64 });

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
                    .setTitle('📄 Ticket Transcript Saved')
                    .setColor('#2f3136')
                    .addFields(
                        { name: 'Channel', value: `\`${channel.name}\``, inline: true },
                        { name: 'Opened by', value: user ? `${user.tag}` : 'Unknown', inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed], files: [transcript] });
            }

            if (user) {
                const ratingEmbed = new EmbedBuilder()
                    .setTitle('⭐ Rate our Support')
                    .setDescription('We hope we helped you! Please rate the attention received from our team.')
                    .setColor('#f1c40f')
                    .setFooter({ text: 'Your feedback helps us improve.' });

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
                        content: '📎 Here is a copy of your ticket transcript:',
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
                    .setTitle('🌟 New Feedback Received')
                    .setColor('#a55eea')
                    .addFields(
                        { name: 'User', value: `${interaction.user.tag}`, inline: true },
                        { name: 'Ticket', value: `\`${ticketName}\``, inline: true },
                        { name: 'Rating', value: '⭐'.repeat(parseInt(stars)), inline: false }
                    )
                    .setTimestamp();

                await ratingsChannel.send({ embeds: [feedbackEmbed] });
            }

            await interaction.update({ 
                content: '✅ Thank you for your feedback!', 
                embeds: [], 
                components: [] 
            });
        }


















    },
};