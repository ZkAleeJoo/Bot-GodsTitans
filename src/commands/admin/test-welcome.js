const { SlashCommandBuilder, PermissionFlagsBits, Events } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-welcome')
        .setDescription('Simula la entrada de un miembro para probar el sistema de bienvenidas.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), 

    async execute(interaction) {
        const { client, member } = interaction;

        try {
            await interaction.reply({ 
                content: '⏳ Simulando evento de bienvenida...', 
                flags: 64
            });


            client.emit(Events.GuildMemberAdd, member);

        } catch (error) {
            console.error('Error al simular bienvenida:', error);
            await interaction.editReply({ 
                content: '❌ Ocurrió un error al intentar simular el evento.', 
                flags: 64
            });
        }
    },
};