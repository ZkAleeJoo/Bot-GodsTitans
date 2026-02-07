const { Events, ActivityType } = require('discord.js');
const chalk = require('chalk');

module.exports = {
    name: Events.ClientReady,
    once: true, 
    execute(client) {
        const commandsCount = client.commands.size;
        const guildCount = client.guilds.cache.size;
        const ping = client.ws.ping;

        console.log(chalk.cyan.bold('\n' + '═'.repeat(40)));
        console.log(chalk.white.bold('       🚀 SISTEMA GODS TITANS ACTIVO'));
        console.log(chalk.cyan.bold('═'.repeat(40)));
        
        console.log(`${chalk.blue.bold(' 👤 Bot:')}      ${chalk.white(client.user.tag)}`);
        console.log(`${chalk.green.bold(' 🛰️ Latencia:')} ${chalk.white(ping + 'ms')}`);
        console.log(`${chalk.yellow.bold(' 📦 Comandos:')} ${chalk.white(commandsCount + ' cargados')}`);
        console.log(`${chalk.magenta.bold(' 🏠 Servidores:')}${chalk.white(guildCount)}`);
        console.log(`${chalk.red.bold(' 🛠️ Node.js:')}   ${chalk.white(process.version)}`);
        
        console.log(chalk.cyan.bold('═'.repeat(40) + '\n'));

        const activities = [
            { name: `Actualizando el Servidor...`, type: ActivityType.Watching },
            { name: `${commandsCount} comandos disponibles`, type: ActivityType.Listening },
            { name: 'play.godstitans.lat', type: ActivityType.Playing },
        ];

        let i = 0;
        const updateStatus = () => {
            if (i >= activities.length) i = 0;
            client.user.setActivity(activities[i]);
            i++;
        };

        updateStatus();
        setInterval(updateStatus, 30000);
    },
};