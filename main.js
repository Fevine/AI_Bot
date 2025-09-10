// src/index.js
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { handleCommands } = require('./src/commands/afkCommands');
const { userActivity, checkAfk } = require('./src/utils/afkManager');

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const COMMAND_CHANNEL_ID = "1415182602452602921";
const AFK_LOG_CHANNEL_ID = "1415190744108630017";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once('clientReady', () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', message => {
  handleCommands(message, COMMAND_CHANNEL_ID);
});

client.on('voiceStateUpdate', (oldState, newState) => {
  userActivity[newState.id] = Date.now();
});

// Periodically check for AFK
setInterval(() => checkAfk(client, AFK_LOG_CHANNEL_ID), 30 * 1000);

client.login(TOKEN);
