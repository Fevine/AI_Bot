// src/utils/deathMessagesAI.js
const OpenAI = require("openai");
const fallbackMessages = require("./deathMessages");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get AI-generated death message
async function getDeathMessage(username) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a funny bot that invents short, witty 'death messages' for Discord when users go AFK.",
        },
        {
          role: "user",
          content: `Generate a funny short message about ${username} going AFK.`,
        },
      ],
      max_tokens: 20,
    });

    const aiMessage = response.choices[0].message.content.trim();
    return aiMessage;
  } catch (err) {
    console.error("AI message error:", err);

    // fallback to static messages
    const randomMsg = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    return randomMsg;
  }
}

module.exports = { getDeathMessage };
