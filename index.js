// ===============================
// 1. IMPORTS
// ===============================
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ===============================
// 2. APP SETUP
// ===============================
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

console.log("ENV CHECK:", process.env.ANTHROPIC_API_KEY ? "LOADED ✅" : "NOT LOADED ❌");

// ===============================
// 3. ROOT ROUTE (FIXES YOUR ISSUE)
// ===============================
app.get("/", (req, res) => {
  res.send("🚀 AI Incident Command Center is LIVE");
});

// ===============================
// 4. CLAUDE CALL
// ===============================
async function callClaude(prompt) {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    return msg.content[0].text;

  } catch (err) {
    console.error("FULL ERROR:", err);
    return "⚠️ Claude API error";
  }
}

// ===============================
// 5. AGENTS
// ===============================
async function supportAgent(input) {
  return await callClaude(`Act as support engineer and respond clearly:\n${input}`);
}

async function analyticsAgent(input) {
  return await callClaude(`Analyze root cause:\n${input}`);
}

async function devAgent(input) {
  return await callClaude(`Give technical fix steps:\n${input}`);
}

// ===============================
// 6. MAIN API
// ===============================
app.post("/ask", async (req, res) => {
  const input = req.body.input;

  const response = {
    support: await supportAgent(input),
    analytics: await analyticsAgent(input),
    dev: await devAgent(input),
  };

  res.json(response);
});

// ===============================
// 7. TEST ROUTE
// ===============================
app.get("/test", async (req, res) => {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 50,
      messages: [{ role: "user", content: "Say hello" }],
    });

    res.json({ result: msg.content[0].text });

  } catch (err) {
    console.error(err);
    res.json({ error: err.message });
  }
});

// ===============================
// 8. START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});