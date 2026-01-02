/**
 * server/src/utils/reportPrompt.js
 *
 * Utility to build a structured AI prompt from raw metrics.
 * Exports: buildReportPrompt(metrics, type, range)
 */

function fmtNum(n) {
  if (n === null || n === undefined) return "0";
  return n.toLocaleString ? n.toLocaleString() : String(n);
}

/**
 * Build a complete text prompt for an LLM given platform metrics.
 *
 * @param {Object} metrics - Raw metrics object from MongoDB queries.
 * @param {string} type - Report type (e.g. 'monthly', 'mentorActivity').
 * @param {string|Object} range - Range token or object describing start/end.
 * @returns {string} prompt ready to send to OpenAI
 */
export function buildReportPrompt(metrics = {}, type = "Report", range = {}) {
  const totalStudents = metrics.totalStudents || 0;
  const totalMentors = metrics.totalMentors || 0;
  const completedSessions = metrics.completedSessions || 0;
  const pendingRequests = metrics.pendingRequests || 0;
  const pendingAccounts = typeof metrics.pendingAccounts !== 'undefined' ? metrics.pendingAccounts : null;
  const topMentors = Array.isArray(metrics.topMentors) ? metrics.topMentors : [];

  const rangeText = typeof range === "string" ? range : (range && (range.start || range.end))
    ? `from ${range.start || 'N/A'} to ${range.end || 'N/A'}`
    : String(range);

  const topMentorsText = topMentors.length
    ? topMentors.map((m) => `${m.name || 'Unknown'} (${m.sessions || 0})`).join(", ")
    : "None";

  // Prompt structure required by the system
  const lines = [];
  lines.push(`Report Type: ${type}`);
  lines.push(`Date Range: ${rangeText}`);
  lines.push("");

  lines.push("Executive Summary:\nProvide a concise executive summary (3-5 sentences) that highlights the overall performance and the most important takeaway.");
  lines.push("");

  lines.push("Key Metrics:\nList the primary metrics clearly and explain what each number represents. Use short sentences and plain language.");
  lines.push(`- Total students: ${fmtNum(totalStudents)}`);
  lines.push(`- Total mentors: ${fmtNum(totalMentors)}`);
  lines.push(`- Completed sessions: ${fmtNum(completedSessions)}`);
  if (pendingAccounts !== null) lines.push(`- Pending accounts: ${fmtNum(pendingAccounts)}`);
  lines.push(`- Pending requests: ${fmtNum(pendingRequests)}`);
  lines.push(`- Top mentors (name and sessions): ${topMentorsText}`);
  lines.push("");

  lines.push("Deep Interpretation:\nProvide a deeper interpretation of the numbers. Explain trends, distribution, and implications for stakeholders. Where appropriate, compare metrics (for example sessions-per-student or mentor concentration). Use clear reasoning and avoid speculation beyond the data.");
  lines.push("");

  lines.push("Chart Narratives (text-only):\nFor each suggested chart, provide a short descriptive narrative (do NOT produce images or code). Describe what the chart would show and the insight it would reveal. Keep these descriptions strictly textual and concise.");
  lines.push("- Sessions distribution: describe concentration among top mentors vs rest.");
  lines.push("- Demand vs capacity: describe pending requests relative to completed sessions.");
  lines.push("- Sessions per student histogram: describe spread and median behavior.");
  lines.push("");

  lines.push("Key Insights:\nProvide 4-6 bullet points with the most important insights derived from the data. Keep insights actionable and prioritized.");
  lines.push("");

  lines.push("Risks:\nList the primary operational and programmatic risks implied by the metrics (e.g., mentor burnout, student churn). For each risk include a one-line rationale.");
  lines.push("");

  lines.push("Recommendations:\nProvide clear, prioritized recommendations (short bullets) that stakeholders can implement. Indicate estimated effort or priority (high/medium/low) when applicable.");
  lines.push("");

  lines.push("Next Steps:\nProvide 3-5 concrete next steps with owners/roles suggested for execution (e.g. operations, product, recruitment). Keep steps short and time-bound.");
  lines.push("");

  lines.push("Formatting Instructions:\n- Speak professionally and clearly.\n- Explain numbers in plain English (do not assume technical audience).\n- Produce structured output using headings and short paragraphs or bullets.\n- Do NOT include code blocks.\n- Keep charts descriptive and do not attempt to render images or ASCII charts.\n- Keep the report concise (aim for ~600-900 words).\n");

  lines.push("Data Context (provide exact numbers used):");
  // include pendingAccounts in the data context when available
  const dataContext = { totalStudents, totalMentors, completedSessions, pendingRequests, topMentors };
  if (pendingAccounts !== null) dataContext.pendingAccounts = pendingAccounts;
  lines.push(JSON.stringify(dataContext, null, 2));

  // Final instruction: produce the report only
  lines.push("");
  lines.push("Please produce the report now following the structure above.");

  return lines.join("\n");
}

export default buildReportPrompt;
