const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;

const COMMAND_CHANNEL_ID = "1415182602452602921";

let afkTimeMins = 0.05;
let AFK_TIMEOUT = afkTimeMins * 60 * 1000;

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

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Track message activity
client.on('messageCreate', message => {
  if (message.author.bot) return;
  userActivity[message.author.id] = Date.now();

  // Only allow in the command channel
  if (message.channel.id !== COMMAND_CHANNEL_ID) return;

  const args = message.content.trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  if (command === "!setafk") {
    if (args.length === 0 || isNaN(args[0])) {
      return message.reply("⚠️ Please provide a number in minutes. Example: `!setafk 5`");
    }

    afkTimeMins = parseFloat(args[0]);
    AFK_TIMEOUT = afkTimeMins * 60 * 1000;

    message.channel.send(`✅ AFK timeout updated to **${afkTimeMins} minutes**`);
  }

  if (command === "!getafk") {
    message.channel.send(`⏱ Current AFK timeout is **${afkTimeMins} minutes**`);
  }
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
