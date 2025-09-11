// src/utils/deathMessagesOllama.js
const fetch = require("node-fetch");
const fallbackMessages = require("./deathMessages");

async function getDeathMessage(username) {
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3", // change to the model you pulled
        prompt: `Create a short, funny "death message" for when ${username} goes AFK in Discord. Keep it under 10 words.`,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Ollama returns an object with `response`
    const msg = data.response.trim();

    // Make sure it's not empty
    if (!msg) {
      const randomMsg = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
      return randomMsg;
    }

    return msg;
  } catch (err) {
    console.error("Ollama message error:", err);

    // fallback to static messages
    const randomMsg = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    return randomMsg;
  }
}

module.exports = { getDeathMessage };
