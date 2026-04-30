let stats = { p1: 0, p2: 0, p3: 0 };

function getSeverity(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("down") || t.includes("outage") || t.includes("failed")) return "p1";
  if (t.includes("slow") || t.includes("degraded")) return "p2";
  return "p3";
}

function saveIncident(text) {
  const sev = getSeverity(text);
  stats[sev]++;
  return sev;
}

function getStats() {
  return stats;
}

module.exports = { saveIncident, getStats };