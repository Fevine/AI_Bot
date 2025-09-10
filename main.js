const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;

const afkTimeMins = 0.05

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,      // For message events
    GatewayIntentBits.MessageContent,     // Privileged, must be enabled in portal
    GatewayIntentBits.GuildVoiceStates    // Needed for moving users in voice channels
  ]
});

// Object to track user activity timestamps
const userActivity = {};

// Set AFK timeout in milliseconds (3 minutes)
const AFK_TIMEOUT = afkTimeMins * 60 * 1000;

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Track message activity
client.on('messageCreate', message => {
  if (message.author.bot) return;
  userActivity[message.author.id] = Date.now();
});

// Track voice activity
client.on('voiceStateUpdate', (oldState, newState) => {
  const userId = newState.id;
  userActivity[userId] = Date.now();
});

// Periodically check for inactive users
setInterval(async () => {
  const now = Date.now();

  client.guilds.cache.forEach(async guild => {
    const afkChannel = guild.afkChannel; // Get the guild's AFK channel
    if (!afkChannel) return;

    const members = guild.members.cache.filter(
      member => member.voice.channel && !member.user.bot
    );

    members.forEach(member => {
      const lastActive = userActivity[member.id] || 0;
      if (now - lastActive > AFK_TIMEOUT) {
        if (member.voice.channel.id !== afkChannel.id) {
          member.voice.setChannel(afkChannel).catch(console.error);

          // 🔹 Send a message in a text channel (e.g., the first available)
          const defaultChannel = guild.systemChannel || guild.channels.cache.find(
            c => c.isTextBased() && c.permissionsFor(guild.members.me).has("SendMessages")
          );

          if (defaultChannel) {
            defaultChannel.send(`${member.user.globalName} died!`);
          }
        }
      }
    });
  });
}, 30 * 1000); // Check every 30 seconds

client.login(TOKEN);
