// Build a consistent structured output for reports
export function buildReportOutput(reportText, metrics = {}, type = '', rangeLabel = '', htmlFallback = null) {
  const plain = String(reportText || "").trim();

  // summary: first paragraph (up to first blank line)
  const paragraphs = plain.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const summary = paragraphs.length ? paragraphs[0] : (metrics && metrics.summary) || `${type} – ${rangeLabel}`;

  // stats: canonical numeric dictionary
  const stats = {
    totalStudents: Number(metrics.totalStudents || 0),
    totalMentors: Number(metrics.totalMentors || 0),
    pendingAccounts: Number(metrics.pendingAccounts || 0),
    completedSessions: Number(metrics.completedSessions || 0),
    pendingRequests: Number(metrics.pendingRequests || 0),
  };

  // breakdown: arrays suitable for charts
  const breakdown = {
    topMentors: Array.isArray(metrics.topMentors) ? metrics.topMentors : [],
    mentorSessions: metrics.typeSpecific?.mentorSessions || [],
    studentSessions: metrics.typeSpecific?.studentSessions || [],
    topMajors: metrics.typeSpecific?.topMajors || [],
    workloadCounts: metrics.typeSpecific?.workloadCounts || {},
  };

  // tables: detailed rows (e.g., pending requests)
  const tables = {
    pendingRequests: Array.isArray(metrics.typeSpecific?.pendingRequests) ? metrics.typeSpecific.pendingRequests : [],
    topMentors: Array.isArray(metrics.topMentors) ? metrics.topMentors : [],
  };

  // aiText: use last paragraph or provided fallback conclusion
  const aiText = paragraphs.length > 1 ? paragraphs[paragraphs.length - 1] : plain;

  // Try to extract structured sections from the AI text: Key Insights, Risks, Recommendations
  const extracted = extractSectionsFromText(plain, ["key insights", "insights", "risks", "recommendations"]);

  // If extraction failed for any section, derive heuristics from metrics
  const heuristics = generateInsightsFromMetrics(metrics || {});

  const keyInsights = extracted.insights.length ? extracted.insights : heuristics.insights;
  const risks = extracted.risks.length ? extracted.risks : heuristics.risks;
  const recommendations = extracted.recommendations.length ? extracted.recommendations : heuristics.recommendations;

  // If htmlFallback is provided, prefer it. Otherwise build a print-ready HTML including inline SVG charts.
  const html = htmlFallback || buildPrintableHtml({ title: type, rangeLabel, summary, stats, breakdown, tables, aiText, fullText: plain, keyInsights, risks, recommendations });

  return { summary, stats, breakdown, tables, aiText, html, fullText: plain, keyInsights, risks, recommendations };
}

function buildPrintableHtml({ title, rangeLabel, summary, stats, breakdown, tables, aiText, fullText, keyInsights = [], risks = [], recommendations = [] }) {
  const css = `
    @page { size: A4; margin: 18mm; }
    body{font-family: Inter, Arial, Helvetica, sans-serif; color:#0f1724; margin:0; padding:0;}
    .page{padding:18mm}
    h1{font-size:18px;color:#0b57a4;margin:0 0 6px}
    h2{font-size:14px;color:#0b57a4;margin:14px 0 6px}
    .muted{color:#6b7280;font-size:12px}
    .stats{display:flex;gap:12px;margin:12px 0}
    .stat{flex:1;background:#f8fafc;padding:10px;border-radius:6px;text-align:center}
    .stat .num{font-size:18px;font-weight:700}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th,td{padding:8px;border:1px solid #e6e9ef;text-align:left;font-size:12px}
    .charts{display:flex;gap:12px;margin-top:12px}
    .chart{flex:1}
    .footer{color:#94a3b8;font-size:11px;margin-top:18px}
    .no-break{page-break-inside:avoid}
  `;

  const topMentorsSvg = renderBarSvg(breakdown.topMentors || [], { width: 480, height: 140 });
  const majorsSvg = renderPieSvg(breakdown.topMajors || [], { width: 240, height: 140 });

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${escapeHtml(title)} - ${escapeHtml(rangeLabel)}</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="page">
        <h1>${escapeHtml(title)}</h1>
        <div class="muted">${escapeHtml(rangeLabel)}</div>

        <h2>Executive Summary</h2>
        <div class="muted">${escapeHtml(summary)}</div>

        <div class="stats no-break">
          <div class="stat"><div class="label">Students</div><div class="num">${stats.totalStudents}</div></div>
          <div class="stat"><div class="label">Mentors</div><div class="num">${stats.totalMentors}</div></div>
          <div class="stat"><div class="label">Completed Sessions</div><div class="num">${stats.completedSessions}</div></div>
          <div class="stat"><div class="label">Pending Requests</div><div class="num">${stats.pendingRequests}</div></div>
        </div>

        <div class="charts no-break">
          <div class="chart">
            <h2>Top Mentors</h2>
            ${topMentorsSvg}
          </div>
          <div class="chart">
            <h2>Top Majors</h2>
            ${majorsSvg}
          </div>
        </div>

        <h2>Details</h2>
        <h3>Pending Requests</h3>
        ${renderPendingTable(tables.pendingRequests || [])}

        <h3>Top Mentors</h3>
        ${renderMentorTable(tables.topMentors || [])}

        <h2>Key Insights</h2>
        ${keyInsights && keyInsights.length ? `<ul>${keyInsights.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '<div class="muted">No insights provided.</div>'}

        <h2>Risks / Problems</h2>
        ${risks && risks.length ? `<ul>${risks.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '<div class="muted">No risks identified.</div>'}

        <h2>Recommendations</h2>
        ${recommendations && recommendations.length ? `<ul>${recommendations.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '<div class="muted">No recommendations provided.</div>'}

        <h2>AI Conclusion</h2>
        <div>${escapeHtml(aiText)}</div>

        <div class="footer">Generated: ${new Date().toLocaleString()}</div>
      </div>
    </body>
  </html>`;
}

function renderBarSvg(data = [], opts = {}) {
  const width = opts.width || 480;
  const height = opts.height || 140;
  const pad = 8;
  const barGap = 6;
  const max = data.reduce((m, d) => Math.max(m, Number(d.sessions || 0)), 0) || 1;
  const count = Math.min(data.length, 8);
  const barWidth = Math.max(12, (width - pad * 2 - (count - 1) * barGap) / count);

  let bars = '';
  data.slice(0, count).forEach((d, i) => {
    const x = pad + i * (barWidth + barGap);
    const h = Math.round(((Number(d.sessions || 0) / max) * (height - 40)));
    const y = height - 30 - h;
    bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${h}" fill="#0b57a4"></rect>`;
    bars += `<text x="${x + barWidth / 2}" y="${height - 12}" font-size="10" text-anchor="middle" fill="#0f1724">${escapeHtml(String(d.name || ''))}</text>`;
  });

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
}

function renderPieSvg(data = [], opts = {}) {
  const width = opts.width || 240;
  const height = opts.height || 140;
  const radius = Math.min(width, height) / 2 - 8;
  const cx = width / 2;
  const cy = height / 2;
  const total = data.reduce((s, d) => s + (Number(d.count || 0) || 0), 0) || 1;
  const colors = ['#0b57a4', '#06b6d4', '#4ade80', '#f59e0b', '#ef4444', '#a78bfa'];
  let angle = -Math.PI / 2;
  let slices = '';
  data.slice(0, 6).forEach((d, i) => {
    const v = Number(d.count || 0);
    const a = (v / total) * Math.PI * 2;
    const x1 = cx + radius * Math.cos(angle);
    const y1 = cy + radius * Math.sin(angle);
    angle += a;
    const x2 = cx + radius * Math.cos(angle);
    const y2 = cy + radius * Math.sin(angle);
    const large = a > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
    const color = colors[i % colors.length];
    slices += `<path d="${path}" fill="${color}"></path>`;
  });
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${slices}</svg>`;
}

function renderPendingTable(rows = []) {
  if (!rows.length) return '<div class="muted">No pending requests</div>';
  const header = `<table><thead><tr><th>Requested</th><th>Student</th><th>Mentor</th><th>Topic</th></tr></thead>`;
  const body = rows.map(r => `
    <tr>
      <td>${escapeHtml(r.requestedAt ? new Date(r.requestedAt).toLocaleString() : '')}</td>
      <td>${escapeHtml(r.student || '-')}</td>
      <td>${escapeHtml(r.mentor || '-')}</td>
      <td>${escapeHtml(r.topic || '-')}</td>
    </tr>
  `).join('');
  return `${header}<tbody>${body}</tbody></table>`;
}

function extractSectionsFromText(text = '', sectionKeys = []) {
  const lower = String(text || '');
  const sections = { insights: [], risks: [], recommendations: [] };
  // Normalize headings and split by typical headings
  const headings = ['key insights', 'insights', 'risks', 'recommendations', 'conclusion', 'recommendation'];
  // Simple splitter: find headings and capture following paragraph lines until next heading
  const pattern = /^(#{0,2}\s*)?(Key Insights|Insights|Risks|Recommendations|Conclusion|Recommendation)\s*[:\-]?\s*$/gim;
  // Build index map of headings
  const lines = lower.split(/\n/);
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    const m = ln.match(/^(Key Insights|Insights|Risks|Recommendations|Conclusion|Recommendation)\s*[:\-]?$/i);
    if (m) {
      current = m[1].toLowerCase();
      continue;
    }
    if (!current) continue;
    if (ln === '') continue;
    if (current.includes('insight')) sections.insights.push(lines[i].trim());
    else if (current.includes('risk')) sections.risks.push(lines[i].trim());
    else if (current.includes('recommend')) sections.recommendations.push(lines[i].trim());
  }
  return sections;
}

function generateInsightsFromMetrics(metrics = {}) {
  const insights = [];
  const risks = [];
  const recommendations = [];

  const totalStudents = Number(metrics.totalStudents || 0);
  const totalMentors = Number(metrics.totalMentors || 0);
  const completedSessions = Number(metrics.completedSessions || 0);
  const pendingRequests = Number(metrics.pendingRequests || 0);
  const pendingAccounts = Number(metrics.pendingAccounts || 0);

  if (totalStudents && totalMentors) {
    const studentsPerMentor = (totalStudents / Math.max(1, totalMentors)).toFixed(2);
    insights.push(`Average students per mentor: ${studentsPerMentor}`);
  }

  if (completedSessions > 0 && totalStudents) {
    insights.push(`Average sessions per student: ${(completedSessions / Math.max(1, totalStudents)).toFixed(2)}`);
  }

  if (pendingRequests > 0) {
    risks.push(`${pendingRequests} pending mentoring requests may indicate unmet demand and longer wait times`);
    recommendations.push('Prioritize backlog triage and consider temporary routing to available mentors.');
  }

  if (pendingAccounts > 20) {
    risks.push(`${pendingAccounts} pending account verifications could slow onboarding`);
    recommendations.push('Streamline verification or add admin capacity to clear pending accounts.');
  }

  // Supply vs demand heuristic
  const areaSupply = metrics.areaSupply || {};
  const areaDemand = metrics.areaDemand || {};
  const areas = Array.from(new Set([...Object.keys(areaSupply || {}), ...Object.keys(areaDemand || {})]));
  areas.forEach((a) => {
    const s = Number(areaSupply[a] || 0);
    const d = Number(areaDemand[a] || 0);
    if (d > s * 1.2) {
      risks.push(`High demand vs supply in area: ${a} (d:${d} vs s:${s})`);
      recommendations.push(`Recruit mentors with expertise in ${a} or promote that area to existing mentors.`);
    }
  });

  // Generic recommendations
  if (!recommendations.length) {
    recommendations.push('Monitor pending requests and sessions-per-mentor monthly; consider targeted mentor onboarding if demand grows.');
  }

  return { insights, risks, recommendations };
}

function renderMentorTable(rows = []) {
  if (!rows.length) return '<div class="muted">No mentors data</div>';
  const header = `<table><thead><tr><th>Mentor</th><th>Sessions</th></tr></thead>`;
  const body = rows.map(r => `
    <tr>
      <td>${escapeHtml(r.name || '-')}</td>
      <td>${escapeHtml(String(r.sessions || 0))}</td>
    </tr>
  `).join('');
  return `${header}<tbody>${body}</tbody></table>`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
