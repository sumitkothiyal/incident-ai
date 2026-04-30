// ===============================
// 1. IMPORTS & CONFIG
// ===============================
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");

const { saveIncident, getStats } = require("./memory");

// Initialize Claude client
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

console.log(
  "ENV CHECK:",
  process.env.ANTHROPIC_API_KEY ? "LOADED ✅" : "NOT LOADED ❌"
);

// ===============================
// 3. ROOT ROUTE (HEALTH CHECK)
// ===============================
app.get("/", (req, res) => {
  res.send("⚡ OpsGPT Enterprise is LIVE");
});

// ===============================
// 4. CLAUDE FUNCTION
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
    console.error("CLAUDE ERROR:", err.message);
    return "⚠️ AI response unavailable";
  }
}

// ===============================
// 5. DOMAIN PROMPT ENGINE
// ===============================
function getPrompts(domain, input) {
  const map = {
    it: {
      support: `You are IT support. Respond clearly and calmly:\n${input}`,
      analytics: `Analyze technical root cause in detail:\n${input}`,
      dev: `Provide engineering fix steps:\n${input}`,
    },

    business: {
      support: `You are customer support manager. Respond empathetically:\n${input}`,
      analytics: `Analyze business impact and process gaps:\n${input}`,
      dev: `Suggest operational fixes and improvements:\n${input}`,
    },

    security: {
      support: `You are security response team. Communicate cautiously:\n${input}`,
      analytics: `Assess threat severity, risks, and vulnerabilities:\n${input}`,
      dev: `Provide containment and remediation steps:\n${input}`,
    },
  };

  return map[domain] || map.it;
}

// ===============================
// 6. MAIN API (MULTI-AGENT)
// ===============================
app.post("/ask", async (req, res) => {
  const { input, domain } = req.body;

  if (!input) {
    return res.status(400).json({ error: "Input is required" });
  }

  try {
    const prompts = getPrompts(domain, input);

    const response = {
      support: await callClaude(prompts.support),
      analytics: await callClaude(prompts.analytics),
      dev: await callClaude(prompts.dev),
    };

    // Save incident + calculate severity
    const severity = saveIncident(input);

    res.json({
      ...response,
      severity,
    });
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===============================
// 7. STATS API (DASHBOARD)
// ===============================
app.get("/stats", (req, res) => {
  res.json(getStats());
});

// ===============================
// 8. TEST ROUTE (VERIFY CLAUDE)
// ===============================
app.get("/test", async (req, res) => {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 50,
      messages: [{ role: "user", content: "Say hello in one short sentence" }],
    });

    res.json({ result: msg.content[0].text });
  } catch (err) {
    console.error("TEST ERROR:", err);
    res.json({ error: err.message });
  }
});

// ===============================
// 9. START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 OpsGPT running on port ${PORT}`);
});