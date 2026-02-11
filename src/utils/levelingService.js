const fs = require('node:fs');
const path = require('node:path');

const defaultConfig = require('../config/leveling.default.json');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'leveling-config.json');
const STATS_PATH = path.join(__dirname, '..', 'data', 'leveling-stats.json');

const clone = (value) => JSON.parse(JSON.stringify(value));

const ensureFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '{}', 'utf8');
    }
};

const readJson = (filePath) => {
    ensureFile(filePath);
    try {
        const raw = fs.readFileSync(filePath, 'utf8') || '{}';
        return JSON.parse(raw);
    } catch (error) {
        console.error(`[Leveling] Archivo corrupto en ${filePath}. Se reinicia.`);
        fs.writeFileSync(filePath, '{}', 'utf8');
        return {};
    }
};

const writeJson = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const xpNeededForLevel = (level, config) => {
    const baseXp = config.levelFormula.baseXp;
    const growth = config.levelFormula.growthFactor;
    return Math.max(1, Math.floor(baseXp * Math.pow(level, growth)));
};

const normalizeRoleRewards = (roleRewards = []) => {
    return roleRewards
        .filter((reward) => reward && Number.isInteger(reward.level) && typeof reward.roleId === 'string')
        .sort((a, b) => a.level - b.level);
};

const getGuildConfig = (guildId) => {
    const allConfigs = readJson(CONFIG_PATH);
    const guildConfig = allConfigs[guildId] || {};

    const merged = {
        ...clone(defaultConfig),
        ...guildConfig,
        xp: {
            ...clone(defaultConfig.xp),
            ...(guildConfig.xp || {}),
        },
        levelFormula: {
            ...clone(defaultConfig.levelFormula),
            ...(guildConfig.levelFormula || {}),
        },
        announcement: {
            ...clone(defaultConfig.announcement),
            ...(guildConfig.announcement || {}),
        },
        ignoredChannelIds: Array.isArray(guildConfig.ignoredChannelIds)
            ? guildConfig.ignoredChannelIds
            : clone(defaultConfig.ignoredChannelIds),
        ignoredRoleIds: Array.isArray(guildConfig.ignoredRoleIds)
            ? guildConfig.ignoredRoleIds
            : clone(defaultConfig.ignoredRoleIds),
        roleRewards: normalizeRoleRewards(guildConfig.roleRewards || clone(defaultConfig.roleRewards)),
    };

    merged.xp.minPerMessage = clamp(Number(merged.xp.minPerMessage) || 1, 1, 1000);
    merged.xp.maxPerMessage = clamp(Number(merged.xp.maxPerMessage) || merged.xp.minPerMessage, merged.xp.minPerMessage, 2000);
    merged.xp.cooldownSeconds = clamp(Number(merged.xp.cooldownSeconds) || 0, 0, 3600);
    merged.xp.minMessageLength = clamp(Number(merged.xp.minMessageLength) || 1, 1, 2000);

    merged.levelFormula.baseXp = clamp(Number(merged.levelFormula.baseXp) || 100, 10, 100000);
    merged.levelFormula.growthFactor = clamp(Number(merged.levelFormula.growthFactor) || 1.2, 1.05, 4);

    return merged;
};

const saveGuildConfig = (guildId, configPatch) => {
    const allConfigs = readJson(CONFIG_PATH);
    const current = allConfigs[guildId] || {};

    allConfigs[guildId] = {
        ...current,
        ...configPatch,
        xp: {
            ...(current.xp || {}),
            ...(configPatch.xp || {}),
        },
        levelFormula: {
            ...(current.levelFormula || {}),
            ...(configPatch.levelFormula || {}),
        },
        announcement: {
            ...(current.announcement || {}),
            ...(configPatch.announcement || {}),
        },
    };

    if (configPatch.roleRewards) {
        allConfigs[guildId].roleRewards = normalizeRoleRewards(configPatch.roleRewards);
    }

    writeJson(CONFIG_PATH, allConfigs);
    return getGuildConfig(guildId);
};

const getGuildStats = (guildId) => {
    const allStats = readJson(STATS_PATH);
    if (!allStats[guildId]) {
        allStats[guildId] = { users: {} };
        writeJson(STATS_PATH, allStats);
    }
    return allStats[guildId];
};

const saveGuildStats = (guildId, guildStats) => {
    const allStats = readJson(STATS_PATH);
    allStats[guildId] = guildStats;
    writeJson(STATS_PATH, allStats);
};

const getUserStats = (guildId, userId) => {
    const guildStats = getGuildStats(guildId);
    if (!guildStats.users[userId]) {
        guildStats.users[userId] = {
            xp: 0,
            totalXp: 0,
            level: 0,
            lastMessageAt: 0,
        };
        saveGuildStats(guildId, guildStats);
    }
    return guildStats.users[userId];
};

const randomXp = (config) => {
    const min = config.xp.minPerMessage;
    const max = config.xp.maxPerMessage;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const addXp = (guildId, userId, amount, now, config) => {
    const guildStats = getGuildStats(guildId);
    const userStats = guildStats.users[userId] || {
        xp: 0,
        totalXp: 0,
        level: 0,
        lastMessageAt: 0,
    };

    userStats.xp += amount;
    userStats.totalXp += amount;

    const oldLevel = userStats.level;
    while (userStats.xp >= xpNeededForLevel(userStats.level + 1, config)) {
        userStats.level += 1;
    }

    userStats.lastMessageAt = now;
    guildStats.users[userId] = userStats;
    saveGuildStats(guildId, guildStats);

    return {
        userStats,
        leveledUp: userStats.level > oldLevel,
        oldLevel,
        newLevel: userStats.level,
    };
};

const getLeaderboard = (guildId, limit = 10) => {
    const guildStats = getGuildStats(guildId);
    const users = Object.entries(guildStats.users)
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => {
            if (b.level !== a.level) return b.level - a.level;
            if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
            return b.xp - a.xp;
        });

    return users.slice(0, clamp(limit, 1, 25));
};

module.exports = {
    getGuildConfig,
    saveGuildConfig,
    getUserStats,
    addXp,
    randomXp,
    xpNeededForLevel,
    getLeaderboard,
};
