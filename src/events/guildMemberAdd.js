const { Events, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,
    async execute(member) {
        const roleId = process.env.MEMBER_ROLE_ID;
        const role = member.guild.roles.cache.get(roleId);
        if (role) {
            try { await member.roles.add(role); } catch (e) { console.error('Error Rol:', e); }
        }

        const channelId = process.env.WELCOME_CHANNEL_ID;
        const channel = member.guild.channels.cache.get(channelId);
        if (!channel) return;

        const canvas = createCanvas(700, 250);
        const ctx = canvas.getContext('2d');

        const background = await loadImage('https://i.pinimg.com/736x/58/1a/45/581a4501e54abe4fd2efcff15573fd3e.jpg'); 
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        ctx.save(); 
        
        ctx.beginPath();
        ctx.arc(125, 125, 80, 0, Math.PI * 2, true); 
        ctx.closePath();
        ctx.clip(); 

        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await loadImage(avatarURL);
        ctx.drawImage(avatar, 45, 45, 160, 160);

        ctx.restore(); 

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 45px sans-serif';
        ctx.fillText('WELCOME', 250, 100);

        ctx.fillStyle = '#a55eea'; 
        ctx.font = '30px sans-serif';
        ctx.fillText(member.user.username.toUpperCase(), 250, 140);

        ctx.fillStyle = '#45aaf2'; 
        ctx.font = '20px sans-serif';
        const memberCount = member.guild.memberCount;
        ctx.fillText(`CONGRATULATIONS, YOU ARE THE #${memberCount} MEMBER`, 250, 180);

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome-image.png' });

        channel.send({
            content: `Welcome ${member} to the server | Don't forget to read the <#1448310984132526100> - <#1448316267122655353>`,
            files: [attachment]
        });
    },
};