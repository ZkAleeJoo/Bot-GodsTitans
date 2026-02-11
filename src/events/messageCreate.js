const { Events } = require('discord.js');
const {
    getGuildConfig,
    addXp,
    randomXp,
    getUserStats,
} = require('../utils/levelingService');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message) {
        if (!message.guild || message.author.bot) return;

        const config = getGuildConfig(message.guild.id);
        if (!config.enabled) return;

        if (config.ignoredChannelIds.includes(message.channel.id)) return;
        if (!message.content || message.content.trim().length < config.xp.minMessageLength) return;
        if (message.member.roles.cache.some((role) => config.ignoredRoleIds.includes(role.id))) return;

        const now = Date.now();
        const userStats = getUserStats(message.guild.id, message.author.id);
        const elapsedSeconds = (now - (userStats.lastMessageAt || 0)) / 1000;
        if (elapsedSeconds < config.xp.cooldownSeconds) return;

        const xp = randomXp(config);
        const levelResult = addXp(message.guild.id, message.author.id, xp, now, config);

        if (!levelResult.leveledUp) return;

        const rewards = [];
        for (const reward of config.roleRewards) {
            if (levelResult.newLevel < reward.level) continue;
            const role = message.guild.roles.cache.get(reward.roleId);
            if (!role || message.member.roles.cache.has(role.id)) continue;
            try {
                await message.member.roles.add(role.id);
                rewards.push(role);
            } catch (error) {
                console.error(`[Leveling] No se pudo asignar rol ${reward.roleId} a ${message.author.id}:`, error.message);
            }
        }

        if (!config.announcement.enabled) return;

        const announceChannel = config.announcement.channelId
            ? message.guild.channels.cache.get(config.announcement.channelId)
            : message.channel;

        if (!announceChannel || !announceChannel.isTextBased()) return;

        const text = config.announcement.messageTemplate
            .replace('{user}', `<@${message.author.id}>`)
            .replace('{level}', String(levelResult.newLevel))
            .replace('{rewardCount}', String(rewards.length));

        await announceChannel.send({ content: text }).catch(() => {});
    },
};