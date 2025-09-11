// src/utils/afkManager.js
const { getDeathMessage } = require("./deathMessagesOllama");
const fallbackMessages = require("./deathMessages");

let afkTimeMins = 0.1;
let AFK_TIMEOUT = afkTimeMins * 60 * 1000;

const userActivity = {};
let useAiDeaths = true; // default ON

function setAfkTime(minutes) {
  afkTimeMins = minutes;
  AFK_TIMEOUT = afkTimeMins * 60 * 1000;
}

function getAfkTime() {
  return afkTimeMins;
}

function toggleAiDeaths(state) {
  if (typeof state === "boolean") {
    useAiDeaths = state;
  }
}

function isAiDeathsEnabled() {
  return useAiDeaths;
}

// Check inactive members and move them to AFK
async function checkAfk(client, AFK_LOG_CHANNEL_ID) {
  const now = Date.now();

  client.guilds.cache.forEach(async guild => {
    const afkChannel = guild.afkChannel;
    if (!afkChannel) return;

    const members = guild.members.cache.filter(
      member => member.voice.channel && !member.user.bot
    );

    for (const member of members.values()) {
      const lastActive = userActivity[member.id] || 0;
      if (now - lastActive > AFK_TIMEOUT) {
        if (member.voice.channel.id !== afkChannel.id) {
          await member.voice.setChannel(afkChannel).catch(console.error);

          let msg;
          if (useAiDeaths) {
            msg = await getDeathMessage(member.user.username);
          } else {
            msg = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
          }

          const logChannel = guild.channels.cache.get(AFK_LOG_CHANNEL_ID);
          if (logChannel && logChannel.isTextBased()) {
            logChannel.send(`💤 ${member.user.globalName || member.user.username} ${msg}`);
          }
        }
      }
    }
  });
}

module.exports = {
  userActivity,
  setAfkTime,
  getAfkTime,
  toggleAiDeaths,
  isAiDeathsEnabled,
  AFK_TIMEOUT,
  checkAfk
};
