// src/utils/afkManager.js
const deathMessages = require('./deathMessages');

let afkTimeMins = 0.1;
let AFK_TIMEOUT = afkTimeMins * 60 * 1000;

const userActivity = {};

function setAfkTime(minutes) {
  afkTimeMins = minutes;
  AFK_TIMEOUT = afkTimeMins * 60 * 1000;
}

function getAfkTime() {
  return afkTimeMins;
}

// Call periodically to move inactive users
async function checkAfk(client, AFK_LOG_CHANNEL_ID) {
  const now = Date.now();

  client.guilds.cache.forEach(guild => {
    const afkChannel = guild.afkChannel;
    if (!afkChannel) return;

    const members = guild.members.cache.filter(
      member => member.voice.channel && !member.user.bot
    );

    members.forEach(member => {
      const lastActive = userActivity[member.id] || 0;
      if (now - lastActive > AFK_TIMEOUT) {
        if (member.voice.channel.id !== afkChannel.id) {
          member.voice.setChannel(afkChannel).catch(console.error);

          const randomMsg = deathMessages[Math.floor(Math.random() * deathMessages.length)];
          const logChannel = guild.channels.cache.get(AFK_LOG_CHANNEL_ID);
          if (logChannel && logChannel.isTextBased()) {
            logChannel.send(`💤 ${member.user.globalName || member.user.username} ${randomMsg}`);
          }
        }
      }
    });
  });
}

module.exports = {
  userActivity,
  setAfkTime,
  getAfkTime,
  AFK_TIMEOUT,
  checkAfk
};
