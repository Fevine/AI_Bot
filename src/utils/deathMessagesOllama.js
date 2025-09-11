// src/utils/deathMessagesOllama.js
const fetch = require("node-fetch");
const fallbackMessages = require("./deathMessages");

async function getDeathMessage(username) {
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: `Create a short, funny "death message" for when ${username} goes AFK in Discord. Keep it under 10 words.`,
        stream: false,
      }),
    });

    if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);
    const data = await response.json();
    const msg = data.response.trim();

    return msg || fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
  } catch (err) {
    console.error("Ollama error:", err);
    return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
  }
}

module.exports = { getDeathMessage };
