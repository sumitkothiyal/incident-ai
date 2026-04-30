// ===============================
// 1. IMPORTS & CONFIG
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

const PORT = 3000;

// Debug check
console.log("ENV CHECK:", process.env.ANTHROPIC_API_KEY ? "LOADED ✅" : "NOT LOADED ❌");

// ===============================
// 3. CLAUDE FUNCTION (CORE AI)
// ===============================
async function callClaude(prompt) {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6", // ✅ WORKING MODEL FROM YOUR ACCOUNT
      max_tokens: 200,
      messages: [
        { role: "user", content: prompt }
      ],
    });

    return msg.content[0].text;

  } catch (err) {
    console.error("FULL ERROR:", err.message);
    return "⚠️ Claude API error";
  }
}

// ===============================
// 4. AGENTS (MULTI-AGENT SYSTEM)
// ===============================
async function supportAgent(input) {
  return await callClaude(
    `You are a support engineer. Respond clearly and calmly to this issue:\n${input}`
  );
}

async function analyticsAgent(input) {
  return await callClaude(
    `You are a system analyst. Identify root cause of this issue:\n${input}`
  );
}

async function devAgent(input) {
  return await callClaude(
    `You are a backend engineer. Suggest technical fix steps:\n${input}`
  );
}

// ===============================
// 5. MAIN API (USED BY UI)
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
// 6. TEST ROUTE (VERY IMPORTANT)
// ===============================
app.get("/test", async (req, res) => {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 50,
      messages: [
        { role: "user", content: "Say hello in one short sentence" }
      ],
    });

    res.json({ result: msg.content[0].text });

  } catch (err) {
    console.error("FULL ERROR:", err);
    res.json({ error: err.message });
  }
});

// ===============================
// 7. MODEL DISCOVERY (OPTIONAL)
// ===============================
app.get("/models", async (req, res) => {
  try {
    const models = await anthropic.models.list();
    res.json(models);
  } catch (err) {
    console.error("MODEL LIST ERROR:", err.message);
    res.json({ error: err.message });
  }
});

// ===============================
// 8. START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});