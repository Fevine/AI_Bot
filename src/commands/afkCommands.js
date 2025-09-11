// src/commands/afkCommands.js
const { setAfkTime, getAfkTime, userActivity } = require("../utils/afkManager");

function handleCommands(message, COMMAND_CHANNEL_ID) {
  if (message.author.bot) return;
  userActivity[message.author.id] = Date.now();

  if (message.channel.id !== COMMAND_CHANNEL_ID) return;

  const args = message.content.trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  if (command === "!setafk") {
    if (args.length === 0 || isNaN(args[0])) {
      return message.reply("⚠️ Provide a number in minutes. Example: `!setafk 5`");
    }
    setAfkTime(parseFloat(args[0]));
    message.channel.send(`✅ AFK timeout updated to **${getAfkTime()} minutes**`);
  }

  if (command === "!getafk") {
    message.channel.send(`⏱ Current AFK timeout is **${getAfkTime()} minutes**`);
  }

  if (command === "!afkstatus") {
    const now = Date.now();
    const guild = message.guild;
    const members = guild.members.cache.filter(
      member => member.voice.channel && !member.user.bot
    );

    if (members.size === 0) {
      return message.channel.send("No active members in voice channels.");
    }

    const statusList = members.map(member => {
      const lastActive = userActivity[member.id] || 0;
      const inactiveTime = now - lastActive;
      const remaining = getAfkTime() * 60 * 1000 - inactiveTime;
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      return `${member.user.username} — ${remaining > 0 ? `${mins}m ${secs}s until AFK` : "AFK soon!"}`;
    });

    message.channel.send("⏱ **AFK Status:**\n" + statusList.join("\n"));
  }
}

module.exports = { handleCommands };
