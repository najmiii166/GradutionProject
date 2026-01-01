// Simple report generator utility.
// This is a placeholder pipeline that follows the 4-step prompt flow:
// 1) CONTEXT, 2) DATA INPUT, 3) FULL HTML REPORT, 4) PDF VERSION BLOCK
// Replace the internal `callAI` implementation with a real LLM/service integration.

export async function generateReportFromPrompt({ contextPrompt, dataInput, fullPrompt, pdfPrompt }) {
  // Deterministic readable report generator based on provided data.
  // This produces structured HTML (Executive summary, Interpretation,
  // Charts explanation (narrative), Key insights, Recommendations, Conclusion).

  const data = dataInput || {};

  const totalStudents = Number(data.totalStudents || 0);
  // Accept either `activeMentors` or `totalMentors` from callers
  const activeMentors = Number(data.activeMentors || data.totalMentors || 0);
  const pendingRequests = Number(data.pendingRequests || 0);
  const pendingAccounts = typeof data.pendingAccounts !== 'undefined' ? Number(data.pendingAccounts) : null;
  const completedSessions = Number(data.completedSessions || 0);
  const topMentors = Array.isArray(data.topMentors) ? data.topMentors : [];

  // Derived metrics
  const avgSessionsPerStudent = totalStudents ? (completedSessions / totalStudents) : 0;
  const avgStudentsPerMentor = activeMentors ? (totalStudents / activeMentors) : 0;
  const topMentorsCount = topMentors.reduce((sum, m) => sum + (Number(m.sessions) || 0), 0);

  // Build narrative sections
  const pendingLine = pendingAccounts !== null ? `${pendingAccounts} pending accounts and ${pendingRequests} pending mentoring requests` : `${pendingRequests} pending requests`;
  const execSummary = `This automated report summarizes monthly mentorship activity for the platform. During the period there were ${totalStudents} students and ${activeMentors} active mentors. ${completedSessions} mentoring sessions were completed and ${pendingLine}.`;

  const interpretation = [];
  interpretation.push(`Total students (${totalStudents}) represent the active learner base for the period.`);
  interpretation.push(`Active mentors (${activeMentors}) suggest an available capacity that yields approximately ${avgStudentsPerMentor.toFixed(2)} students per mentor on average.`);
  interpretation.push(`Completed sessions (${completedSessions}) correspond to about ${avgSessionsPerStudent.toFixed(2)} sessions per student in this period.`);
  if (topMentors.length) {
    interpretation.push(`Top mentors contributed ${topMentorsCount} sessions in total. The top contributors are: ${topMentors.map((m) => `${m.name} (${m.sessions})`).join(', ')}.`);
  }
  if (pendingRequests > 0 || (pendingAccounts !== null && pendingAccounts > 0)) {
    const parts = [];
    if (pendingAccounts !== null && pendingAccounts > 0) parts.push(`${pendingAccounts} pending accounts`);
    if (pendingRequests > 0) parts.push(`${pendingRequests} pending requests`);
    interpretation.push(`There are ${parts.join(' and ')}, indicating unmet demand or onboarding backlog that should be monitored and addressed.`);
  }

  const chartsNarrative = [];
  chartsNarrative.push('If visualized, the distribution of sessions would show concentration among the top mentors with a long tail of lower activity across the remainder.');
  chartsNarrative.push('A demand vs capacity narrative would highlight pending requests stacked against completed sessions to expose capacity shortfalls.');

  const insights = [];
  insights.push('Engagement is healthy given the number of completed sessions, but there is room to increase session frequency per student.');
  insights.push('Workload concentration on a few top mentors presents operational risk and potential burnout.');
  if (pendingRequests > 0) insights.push('Pending requests show immediate unmet demand and could affect student retention if not addressed.');

  const recommendations = [];
  recommendations.push('Redistribute workload by upskilling and incentivizing less-active mentors.');
  recommendations.push('Recruit or onboard targeted mentors to reduce backlog in areas of high demand.');
  recommendations.push('Implement a triage process to match urgent requests more quickly.');
  recommendations.push('Track KPIs monthly: pending requests, sessions-per-mentor, sessions-per-student.');

  const conclusion = 'Addressing capacity concentration and pending requests will improve responsiveness and learner outcomes. The recommended actions should reduce backlog and distribute load more evenly.';

  // Create HTML report
  const reportHtml = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>MentorLink - Monthly Report</title>
      <style>
        body{font-family:Inter, Arial, Helvetica, sans-serif;color:#0f1724;margin:0;padding:24px;background:#fff}
        .container{max-width:900px;margin:0 auto;border:1px solid #e6e6e9;padding:20px;border-radius:8px}
        h1{color:#0b57a4;margin-top:0}
        h2{color:#0b57a4;margin-bottom:6px}
        pre{background:#f8f9fb;padding:12px;border-radius:6px;overflow:auto}
        .muted{color:#6b7280;font-size:13px}
        ul{margin-top:6px}
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Automated Report</h1>
        <div class="muted">${escapeHtml(String(contextPrompt || ''))}</div>
        <hr/>

        <h2>Executive Summary</h2>
        <p>${escapeHtml(execSummary)}</p>

        <h2>Data</h2>
        <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>

        <h2>Data Interpretation</h2>
        <ul>
          ${interpretation.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>

        <h2>Charts (Narrative)</h2>
        <ul>
          ${chartsNarrative.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>

        <h2>Key Insights</h2>
        <ul>
          ${insights.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>

        <h2>Recommendations</h2>
        <ul>
          ${recommendations.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>

        <h2>Conclusion</h2>
        <p>${escapeHtml(conclusion)}</p>

        <footer class="muted" style="margin-top:18px">Generated: ${new Date().toLocaleString()}</footer>
      </div>
    </body>
  </html>`;

  // Simple PDF placeholder (still base64) — keep for compatibility
  const pdfBlock = Buffer.from(`PDF_PLACEHOLDER: MentorLink Report - ${new Date().toISOString()}`).toString('base64');

  const summary = (String(fullPrompt || execSummary).slice(0, 300)) || 'Automated MentorLink report';

  // Build structured output expected by the controller
  const stats = {
    totalStudents,
    activeMentors,
    completedSessions,
    pendingRequests,
    pendingAccounts,
  };

  const breakdown = {
    topMentors,
    studentSessions: data.studentSessions || [],
    mentorSessions: data.mentorSessions || [],
    topMajors: data.topMajors || [],
  };

  const tables = {
    topMentors,
    dataTable: data,
  };

  const aiText = conclusion;

  return { html: reportHtml, pdfBase64: pdfBlock, summary, stats, breakdown, tables, aiText, fullText: `${execSummary}\n\n${interpretation.join('\n')}`, insights, risks: [], recommendations };
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
