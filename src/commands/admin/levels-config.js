const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
} = require('discord.js');
const { getGuildConfig, saveGuildConfig } = require('../../utils/levelingService');

const buildConfigEmbed = (config) => {
    const rewards = config.roleRewards.length
        ? config.roleRewards.map((r) => `• Nivel **${r.level}** → <@&${r.roleId}>`).join('\n')
        : 'Sin recompensas configuradas.';

    return new EmbedBuilder()
        .setTitle('⚙️ Configuración del Sistema de Niveles')
        .setColor('#3498db')
        .addFields(
            { name: 'Estado', value: config.enabled ? '✅ Activado' : '❌ Desactivado', inline: true },
            { name: 'XP por mensaje', value: `${config.xp.minPerMessage} - ${config.xp.maxPerMessage}`, inline: true },
            { name: 'Cooldown', value: `${config.xp.cooldownSeconds}s`, inline: true },
            { name: 'Longitud mínima mensaje', value: `${config.xp.minMessageLength}`, inline: true },
            { name: 'Fórmula', value: `base: ${config.levelFormula.baseXp}, growth: ${config.levelFormula.growthFactor}`, inline: true },
            { name: 'Canal anuncios', value: config.announcement.channelId ? `<#${config.announcement.channelId}>` : 'Canal actual', inline: true },
            { name: 'Recompensas por rol', value: rewards },
        )
        .setFooter({ text: 'Usa /levels-config para modificar estos valores.' });
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('levels-config')
        .setDescription('Configura el sistema de niveles del servidor.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((sub) =>
            sub
                .setName('view')
                .setDescription('Ver configuración actual del sistema de niveles.'),
        )
        .addSubcommand((sub) =>
            sub
                .setName('toggle')
                .setDescription('Activar o desactivar el sistema de niveles.')
                .addBooleanOption((option) =>
                    option
                        .setName('activo')
                        .setDescription('Estado del sistema')
                        .setRequired(true),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName('set-xp')
                .setDescription('Configura XP, cooldown y mensaje mínimo.')
                .addIntegerOption((option) =>
                    option.setName('min').setDescription('XP mínima por mensaje').setMinValue(1).setMaxValue(1000).setRequired(true),
                )
                .addIntegerOption((option) =>
                    option.setName('max').setDescription('XP máxima por mensaje').setMinValue(1).setMaxValue(2000).setRequired(true),
                )
                .addIntegerOption((option) =>
                    option.setName('cooldown').setDescription('Cooldown en segundos').setMinValue(0).setMaxValue(3600).setRequired(true),
                )
                .addIntegerOption((option) =>
                    option.setName('min-mensaje').setDescription('Longitud mínima para dar XP').setMinValue(1).setMaxValue(2000).setRequired(true),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName('set-formula')
                .setDescription('Configura la curva de dificultad de niveles.')
                .addIntegerOption((option) =>
                    option.setName('base').setDescription('XP base para nivel 1').setMinValue(10).setMaxValue(100000).setRequired(true),
                )
                .addNumberOption((option) =>
                    option.setName('growth').setDescription('Factor de crecimiento (1.05 - 4)').setMinValue(1.05).setMaxValue(4).setRequired(true),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName('set-channel')
                .setDescription('Configura canal de anuncios de level up.')
                .addChannelOption((option) =>
                    option.setName('canal').setDescription('Canal para anuncios (si omites, usa canal actual)').setRequired(false),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName('add-role-reward')
                .setDescription('Agrega o actualiza una recompensa de rol por nivel.')
                .addIntegerOption((option) =>
                    option.setName('nivel').setDescription('Nivel requerido').setMinValue(1).setMaxValue(500).setRequired(true),
                )
                .addRoleOption((option) =>
                    option.setName('rol').setDescription('Rol a otorgar al alcanzar el nivel').setRequired(true),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName('remove-role-reward')
                .setDescription('Elimina una recompensa por nivel.')
                .addIntegerOption((option) =>
                    option.setName('nivel').setDescription('Nivel a remover').setMinValue(1).setMaxValue(500).setRequired(true),
                ),
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'view') {
            const config = getGuildConfig(guildId);
            return interaction.reply({ embeds: [buildConfigEmbed(config)], flags: 64 });
        }

        if (subcommand === 'toggle') {
            const enabled = interaction.options.getBoolean('activo', true);
            const config = saveGuildConfig(guildId, { enabled });
            return interaction.reply({ content: `Sistema de niveles ${enabled ? 'activado' : 'desactivado'}.`, embeds: [buildConfigEmbed(config)], flags: 64 });
        }

        if (subcommand === 'set-xp') {
            const min = interaction.options.getInteger('min', true);
            const max = interaction.options.getInteger('max', true);
            const cooldown = interaction.options.getInteger('cooldown', true);
            const minMessageLength = interaction.options.getInteger('min-mensaje', true);

            if (max < min) {
                return interaction.reply({ content: '❌ El valor **max** no puede ser menor que **min**.', flags: 64 });
            }

            const config = saveGuildConfig(guildId, {
                xp: {
                    minPerMessage: min,
                    maxPerMessage: max,
                    cooldownSeconds: cooldown,
                    minMessageLength,
                },
            });

            return interaction.reply({ content: '✅ Configuración XP actualizada.', embeds: [buildConfigEmbed(config)], flags: 64 });
        }

        if (subcommand === 'set-formula') {
            const baseXp = interaction.options.getInteger('base', true);
            const growthFactor = interaction.options.getNumber('growth', true);

            const config = saveGuildConfig(guildId, {
                levelFormula: { baseXp, growthFactor },
            });

            return interaction.reply({ content: '✅ Fórmula de niveles actualizada.', embeds: [buildConfigEmbed(config)], flags: 64 });
        }

        if (subcommand === 'set-channel') {
            const channel = interaction.options.getChannel('canal');
            const channelId = channel ? channel.id : null;

            const config = saveGuildConfig(guildId, {
                announcement: { channelId },
            });

            return interaction.reply({ content: '✅ Canal de anuncios actualizado.', embeds: [buildConfigEmbed(config)], flags: 64 });
        }

        if (subcommand === 'add-role-reward') {
            const level = interaction.options.getInteger('nivel', true);
            const role = interaction.options.getRole('rol', true);

            const current = getGuildConfig(guildId);
            const roleRewards = current.roleRewards.filter((item) => item.level !== level);
            roleRewards.push({ level, roleId: role.id });

            const config = saveGuildConfig(guildId, { roleRewards });
            return interaction.reply({ content: `✅ Recompensa configurada: nivel ${level} → ${role}.`, embeds: [buildConfigEmbed(config)], flags: 64 });
        }

        if (subcommand === 'remove-role-reward') {
            const level = interaction.options.getInteger('nivel', true);
            const current = getGuildConfig(guildId);
            const roleRewards = current.roleRewards.filter((item) => item.level !== level);

            if (roleRewards.length === current.roleRewards.length) {
                return interaction.reply({ content: `No existe recompensa configurada para el nivel ${level}.`, flags: 64 });
            }

            const config = saveGuildConfig(guildId, { roleRewards });
            return interaction.reply({ content: `✅ Recompensa del nivel ${level} eliminada.`, embeds: [buildConfigEmbed(config)], flags: 64 });
        }

        return interaction.reply({ content: 'Subcomando no reconocido.', flags: 64 });
    },
};