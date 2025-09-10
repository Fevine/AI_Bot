const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;

const deathMessages = [
  "fell asleep!",
  "rage quit!",
  "went AFK forever...",
  "has been teleported to the void!",
  "took a nap in voice chat!",
  "disappeared mysteriously..."
];

const COMMAND_CHANNEL_ID = "1415182602452602921";
const AFK_LOG_CHANNEL_ID = "1415190744108630017"; // replace with your #afk-logs channel ID

let afkTimeMins = 0.1;
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

  // 🔹 New command: !afkstatus
  if (command === "!afkstatus") {
    const now = Date.now();
    const guild = message.guild;

    // Only check members in voice channels
    const members = guild.members.cache.filter(
      member => member.voice.channel && !member.user.bot
    );

    if (members.size === 0) {
      return message.channel.send("No active members in voice channels.");
    }

    const statusList = members.map(member => {
      const lastActive = userActivity[member.id] || 0;
      const inactiveTime = now - lastActive;
      const remaining = AFK_TIMEOUT - inactiveTime;

      // Format remaining time nicely
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);

      return `${member.user.username} — ${remaining > 0 ? `${mins}m ${secs}s until AFK` : "AFK soon!"}`;
    });

    message.channel.send("⏱ **AFK Status:**\n" + statusList.join("\n"));
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

          // Pick a random death message
          const randomMsg = deathMessages[Math.floor(Math.random() * deathMessages.length)];

          // Send in AFK log channel
          const logChannel = guild.channels.cache.get(AFK_LOG_CHANNEL_ID);
          if (logChannel && logChannel.isTextBased()) {
            logChannel.send(`💤 ${member.user.globalName || member.user.username} ${randomMsg}`);
          }
        }
      }
    });
  });
}, 30 * 1000); // Check every 30 seconds

client.login(TOKEN);
