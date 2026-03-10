import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Download,
  Users,
  GraduationCap,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock3,
  ListChecks,
} from "lucide-react";
import { universities } from "../../constants/systemData";

const TAB_ITEMS = [
  { key: "users", label: "Verified Users", icon: Users },
  { key: "mentors", label: "Mentor Quality", icon: GraduationCap },
  { key: "sessions", label: "Session Reports", icon: ListChecks },
];

const DATE_OPTIONS = [
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "range", label: "Custom Range" },
  { value: "all", label: "Full History" },
];

function buildDateParams(datePreset, startDate, endDate) {
  let start = null;
  let end = null;
  const now = new Date();

  if (datePreset === "this_month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    end = new Date().toISOString();
  } else if (datePreset === "last_month") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    start = first.toISOString();
    end = last.toISOString();
  } else if (datePreset === "range") {
    if (startDate) start = new Date(startDate).toISOString();
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      end = endOfDay.toISOString();
    }
  }

  return {
    ...(start ? { start } : {}),
    ...(end ? { end } : {}),
  };
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatRangeLabel(datePreset, startDate, endDate) {
  if (datePreset === "range") {
    if (!startDate && !endDate) return "Custom Range";
    return `${startDate || "Start"} → ${endDate || "End"}`;
  }

  return DATE_OPTIONS.find((item) => item.value === datePreset)?.label || "Full History";
}

function formatInstitutionName(value) {
  if (!value) return "—";

  const normalized = String(value).trim();
  const match = universities.find(
    (item) => String(item.key).toLowerCase() === normalized.toLowerCase()
  );

  return match?.name || normalized;
}

function getStatusClasses(status) {
  const map = {
    verified: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
    completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
    ongoing: "border-cyan-500/20 bg-cyan-500/10 text-cyan-600",
    upcoming: "border-violet-500/20 bg-violet-500/10 text-violet-600",
    pending: "border-amber-500/20 bg-amber-500/10 text-amber-600",
    expired: "border-rose-500/20 bg-rose-500/10 text-rose-600",
    rejected: "border-rose-500/20 bg-rose-500/10 text-rose-600",
  };

  return map[String(status || "").toLowerCase()] || "border-border/50 bg-foreground/[0.03] text-foreground/60";
}

function SummaryCard({ title, value, hint, icon, accent = "cyan" }) {
  const accentClasses = {
    cyan: "from-cyan-500/15 to-cyan-500/5 border-cyan-500/20",
    emerald: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/20",
    violet: "from-violet-500/15 to-violet-500/5 border-violet-500/20",
    amber: "from-amber-500/15 to-amber-500/5 border-amber-500/20",
  };

  return (
    <div className={`rounded-[1.75rem] border bg-gradient-to-br p-5 shadow-sm ${accentClasses[accent] || accentClasses.cyan}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-foreground/40">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-foreground/90">{value}</p>
          <p className="mt-2 text-xs text-foreground/50">{hint}</p>
        </div>
        <div className="rounded-2xl border border-white/40 bg-white/50 p-3 text-foreground/70 dark:border-white/5 dark:bg-white/5">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionShell({ title, subtitle, action, children }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/50 bg-card/70 shadow-xl backdrop-blur-xl">
      <div className="flex flex-col gap-3 border-b border-border/40 bg-foreground/[0.02] px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.22em] text-foreground/75">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-foreground/45">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function EmptyBlock({ text }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border/50 bg-foreground/[0.02] px-6 py-14 text-center text-sm text-foreground/45">
      {text}
    </div>
  );
}

function ExportButton({ onClick, label, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-background shadow-xl transition-all hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download size={14} />
      {label}
    </button>
  );
}

export default function ReportsAdminPage({ api }) {
  const [activeTab, setActiveTab] = useState("users");
  const [roleFilter, setRoleFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [lastGeneratedAt, setLastGeneratedAt] = useState(null);

  const [usersLoading, setUsersLoading] = useState(false);
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [mentorReport, setMentorReport] = useState({
    topByRating: [],
    topByAccepted: [],
    bestRatedMentor: null,
  });
  const [sessionReport, setSessionReport] = useState({
    summary: {},
    recentSessions: [],
    topMentorsByCompleted: [],
    statusBreakdown: [],
  });
  const [userRows, setUserRows] = useState([]);

  const dateParams = useMemo(
    () => buildDateParams(datePreset, startDate, endDate),
    [datePreset, startDate, endDate]
  );

  const rangeLabel = useMemo(
    () => formatRangeLabel(datePreset, startDate, endDate),
    [datePreset, startDate, endDate]
  );

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data } = await api.get("/admin/reports/users", {
        params: {
          role: roleFilter,
          full: true,
          ...dateParams,
        },
      });
      setUserRows(data?.rows || []);
    } catch (error) {
      console.error("Failed to load verified users report", error);
      setUserRows([]);
    } finally {
      setUsersLoading(false);
    }
  }, [api, dateParams, roleFilter]);

  const loadMentors = useCallback(async () => {
    setMentorsLoading(true);
    try {
      const { data } = await api.get("/admin/reports/mentors", {
        params: { top: 8, full: true },
      });
      setMentorReport({
        topByRating: data?.topByRating || [],
        topByAccepted: data?.topByAccepted || [],
        bestRatedMentor: data?.bestRatedMentor || null,
      });
    } catch (error) {
      console.error("Failed to load mentor report", error);
      setMentorReport({ topByRating: [], topByAccepted: [], bestRatedMentor: null });
    } finally {
      setMentorsLoading(false);
    }
  }, [api]);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const { data } = await api.get("/admin/reports/sessions", {
        params: {
          top: 12,
          ...dateParams,
        },
      });
      setSessionReport({
        summary: data?.summary || {},
        recentSessions: data?.recentSessions || [],
        topMentorsByCompleted: data?.topMentorsByCompleted || [],
        statusBreakdown: data?.statusBreakdown || [],
      });
    } catch (error) {
      console.error("Failed to load sessions report", error);
      setSessionReport({ summary: {}, recentSessions: [], topMentorsByCompleted: [], statusBreakdown: [] });
    } finally {
      setSessionsLoading(false);
    }
  }, [api, dateParams]);

  const loadAllReports = useCallback(async () => {
    await Promise.all([loadUsers(), loadMentors(), loadSessions()]);
    setLastGeneratedAt(new Date().toISOString());
  }, [loadMentors, loadSessions, loadUsers]);

  useEffect(() => {
    loadAllReports();
  }, [loadAllReports]);

  const exportCurrentTab = useCallback(async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 42;

      const drawHeader = (title, subtitle) => {
        doc.setFillColor(8, 145, 178);
        doc.roundedRect(28, 24, pageWidth - 56, 74, 20, 20, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text(title, 44, 56);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(subtitle, 44, 76);
        y = 122;
      };

      const drawMetricGrid = (items) => {
        const boxWidth = (pageWidth - 76) / 2;
        items.forEach((item, index) => {
          const row = Math.floor(index / 2);
          const col = index % 2;
          const x = 28 + col * (boxWidth + 20);
          const top = y + row * 84;
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(x, top, boxWidth, 68, 16, 16, "FD");
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(String(item.label).toUpperCase(), x + 14, top + 20);
          doc.setFontSize(18);
          doc.setTextColor(15, 23, 42);
          doc.text(String(item.value ?? "—"), x + 14, top + 44);
          if (item.hint) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(String(item.hint), x + 14, top + 58);
          }
        });
        y += Math.ceil(items.length / 2) * 84 + 10;
      };

      const addSectionTitle = (title) => {
        doc.setTextColor(8, 145, 178);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(title, 28, y);
        y += 12;
      };

      if (activeTab === "users") {
        drawHeader("MentorLink Verified Users Report", `Scope: ${roleFilter} • ${rangeLabel}`);
        drawMetricGrid([
          { label: "Rows Exported", value: userRows.length, hint: "Verified accounts only" },
          { label: "Mentors", value: userRows.filter((row) => row.role === "mentor").length, hint: "Verified mentors in report" },
          { label: "Students", value: userRows.filter((row) => row.role === "student").length, hint: "Verified students in report" },
        ]);

        autoTable(doc, {
          startY: y,
          head: [["Name", "Email", "Role", "Affiliation", "Joined"]],
          body: userRows.map((row) => [
            row.name || "—",
            row.email || "—",
            row.role || "—",
            formatInstitutionName(row.institution),
            formatDate(row.createdAt),
          ]),
          theme: "grid",
          headStyles: { fillColor: [8, 145, 178], textColor: 255 },
          styles: { fontSize: 8.5, cellPadding: 5 },
        });
      } else if (activeTab === "mentors") {
        drawHeader("Mentor Quality Report", "Verified mentor rankings and quality indicators");
        drawMetricGrid([
          { label: "Top Rated Mentor", value: mentorReport.bestRatedMentor?.name || "—", hint: `${mentorReport.bestRatedMentor?.averageRating || 0} average rating` },
          { label: "Rated Mentors", value: mentorReport.topByRating.length, hint: "Mentors with rating data" },
          { label: "Accepted Leaders", value: mentorReport.topByAccepted.length, hint: "Mentors by accepted requests" },
        ]);

        addSectionTitle("Verified Mentors by Rating");
        autoTable(doc, {
          startY: y,
          head: [["Mentor", "Institution", "Average Rating", "Total Ratings"]],
          body: mentorReport.topByRating.map((row) => [
            row.name || "—",
            formatInstitutionName(row.institution),
            row.averageRating ?? "0.0",
            row.totalRatings ?? 0,
          ]),
          theme: "grid",
          headStyles: { fillColor: [8, 145, 178], textColor: 255 },
          styles: { fontSize: 8.5, cellPadding: 5 },
        });
        y = doc.lastAutoTable.finalY + 18;

        addSectionTitle("Verified Mentors by Accepted Requests");
        autoTable(doc, {
          startY: y,
          head: [["Mentor", "Institution", "Accepted Requests"]],
          body: mentorReport.topByAccepted.map((row) => [
            row.name || "—",
            formatInstitutionName(row.institution),
            row.accepted ?? 0,
          ]),
          theme: "grid",
          headStyles: { fillColor: [15, 23, 42], textColor: 255 },
          styles: { fontSize: 8.5, cellPadding: 5 },
        });
      } else if (activeTab === "sessions") {
        drawHeader("MentorLink Session Report", `Verified session activity • ${rangeLabel}`);
        drawMetricGrid([
          { label: "Total Sessions", value: sessionReport.summary?.total || 0, hint: "All matched sessions" },
          { label: "Ongoing", value: sessionReport.summary?.ongoing || 0, hint: "Currently live" },
          { label: "Completed", value: sessionReport.summary?.completed || 0, hint: "Finished successfully" },
          { label: "Expired", value: sessionReport.summary?.expired || 0, hint: "Expired sessions" },
        ]);

        autoTable(doc, {
          startY: y,
          head: [["Mentor", "Student", "Status", "Start", "Institution"]],
          body: sessionReport.recentSessions.map((row) => [
            row.mentorName || "—",
            row.studentName || "—",
            row.status || "—",
            formatDateTime(row.startTime || row.requestedAt),
            formatInstitutionName(row.mentorInstitution || row.studentUniversity),
          ]),
          theme: "grid",
          headStyles: { fillColor: [8, 145, 178], textColor: 255 },
          styles: { fontSize: 8.5, cellPadding: 5 },
        });
      }

      doc.save(`${activeTab}-report-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Failed to export report PDF", error);
    }
  }, [activeTab, mentorReport, rangeLabel, roleFilter, sessionReport, userRows]);

  const currentLoading = usersLoading || mentorsLoading || sessionsLoading;

  return (
    <section className="h-full overflow-y-auto bg-background px-6 py-8 custom-scrollbar lg:px-8">
      <div className="mx-auto flex max-w-[1580px] flex-col gap-6">
        <div className="rounded-[2rem] border border-border/50 bg-card/70 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {TAB_ITEMS.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${
                        active
                          ? "bg-foreground text-background shadow-xl"
                          : "border border-border/50 bg-background/70 text-foreground/50 hover:border-cyan-500/30 hover:text-cyan-600"
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl border border-border/50 bg-background/70 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/45">
                <Calendar size={12} />
                {lastGeneratedAt ? `Updated ${new Date(lastGeneratedAt).toLocaleString()}` : "Preparing report..."}
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:items-end">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap xl:justify-end">
                <div className="min-w-[210px] rounded-2xl border border-border/50 bg-background/70 p-3">
                  <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">
                    <Calendar size={12} />
                    Date Scope
                  </label>
                  <select
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value)}
                    className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground outline-none transition-all focus:border-cyan-500/40"
                  >
                    {DATE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {activeTab === "users" && (
                  <div className="min-w-[210px] rounded-2xl border border-border/50 bg-background/70 p-3">
                    <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">
                      <Users size={12} />
                      User Role
                    </label>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground outline-none transition-all focus:border-cyan-500/40"
                    >
                      <option value="all">All Users</option>
                      <option value="mentor"> Mentors</option>
                      <option value="student"> Students</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                <button
                  type="button"
                  onClick={loadAllReports}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/65 transition-all hover:border-cyan-500/30 hover:text-cyan-600"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
                <ExportButton
                  onClick={exportCurrentTab}
                  label={`Export ${TAB_ITEMS.find((tab) => tab.key === activeTab)?.label || "Report"}`}
                  disabled={currentLoading}
                />
              </div>
            </div>
          </div>

          {datePreset === "range" && (
            <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-center">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground outline-none transition-all focus:border-cyan-500/40"
              />
              <span className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-foreground/35">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground outline-none transition-all focus:border-cyan-500/40"
              />
              <button
                type="button"
                onClick={loadAllReports}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-cyan-600"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {activeTab === "users" && (
          <SectionShell
            title="Verified Users Report"
            subtitle={`Showing ${userRows.length} verified ${roleFilter === "all" ? "users" : `${roleFilter}s`} for ${rangeLabel}`}
          >
            {usersLoading ? (
              <EmptyBlock text="Loading verified users report..." />
            ) : userRows.length === 0 ? (
              <EmptyBlock text="No verified users were found for the selected filters." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border/50 text-[10px] uppercase tracking-[0.18em] text-foreground/35">
                      <th className="px-4 py-4 font-black">User</th>
                      <th className="px-4 py-4 font-black">Role</th>
                      <th className="px-4 py-4 font-black">Institution</th>
                      <th className="px-4 py-4 font-black">Status</th>
                      <th className="px-4 py-4 text-right font-black">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {userRows.map((row) => (
                      <tr key={row._id} className="transition-colors hover:bg-foreground/[0.02]">
                        <td className="px-4 py-5">
                          <div className="text-sm font-semibold text-foreground/85">{row.name}</div>
                          <div className="mt-1 text-xs text-foreground/45">{row.email}</div>
                        </td>
                        <td className="px-4 py-5">
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${row.role === "mentor" ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-600" : "border-violet-500/20 bg-violet-500/10 text-violet-600"}`}>
                            {row.role}
                          </span>
                        </td>
                        <td className="px-4 py-5 text-sm text-foreground/60">{formatInstitutionName(row.institution)}</td>
                        <td className="px-4 py-5">
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusClasses(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-5 text-right text-sm text-foreground/55">{formatDate(row.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionShell>
        )}

        {activeTab === "mentors" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SectionShell title="Top Rated Mentors" subtitle="Ranked by average rating and review volume">
              {mentorsLoading ? (
                <EmptyBlock text="Loading mentor quality data..." />
              ) : mentorReport.topByRating.length === 0 ? (
                <EmptyBlock text="No rated verified mentors are available yet." />
              ) : (
                <div className="space-y-3">
                  {mentorReport.topByRating.map((mentor, index) => (
                    <div key={`${mentor.mentorId}-${index}`} className="flex items-center justify-between rounded-[1.5rem] border border-border/50 bg-foreground/[0.02] px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground/85">{mentor.name || "Unnamed mentor"}</p>
                        <p className="mt-1 text-xs text-foreground/45">{formatInstitutionName(mentor.institution)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold text-cyan-600">{mentor.averageRating ?? "0.0"}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/35">{mentor.totalRatings || 0} ratings</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionShell>

            <SectionShell title="Top Mentors by Accepted Requests" subtitle="Operational leaders by accepted student requests">
              {mentorsLoading ? (
                <EmptyBlock text="Loading accepted-request rankings..." />
              ) : mentorReport.topByAccepted.length === 0 ? (
                <EmptyBlock text="No accepted request data is available yet." />
              ) : (
                <div className="space-y-3">
                  {mentorReport.topByAccepted.map((mentor, index) => (
                    <div key={`${mentor.mentorId}-${index}`} className="flex items-center justify-between rounded-[1.5rem] border border-border/50 bg-foreground/[0.02] px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground/85">{mentor.name || "Unnamed mentor"}</p>
                        <p className="mt-1 text-xs text-foreground/45">{formatInstitutionName(mentor.institution)}</p>
                      </div>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                        {mentor.accepted || 0} accepted
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionShell>
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard title="Total Sessions" value={sessionReport.summary?.total || 0} hint="Verified mentor and student sessions" icon={<FileText size={18} className="text-cyan-600" />} accent="cyan" />
              <SummaryCard title="Ongoing" value={sessionReport.summary?.ongoing || 0} hint="Live sessions right now" icon={<RefreshCw size={18} className="text-emerald-600" />} accent="emerald" />
              <SummaryCard title="Completed" value={sessionReport.summary?.completed || 0} hint="Finished sessions in selected range" icon={<CheckCircle2 size={18} className="text-violet-600" />} accent="violet" />
              <SummaryCard title="Expired" value={sessionReport.summary?.expired || 0} hint="Sessions that expired" icon={<Clock3 size={18} className="text-amber-600" />} accent="amber" />
            </div>

            <SectionShell title="Recent Session Log" subtitle="Separate session report with clean export-ready rows">
              {sessionsLoading ? (
                <EmptyBlock text="Loading session report..." />
              ) : sessionReport.recentSessions.length === 0 ? (
                <EmptyBlock text="No sessions were found for the selected range." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border/50 text-[10px] uppercase tracking-[0.18em] text-foreground/35">
                        <th className="px-4 py-4 font-black">Mentor</th>
                        <th className="px-4 py-4 font-black">Student</th>
                        <th className="px-4 py-4 font-black">Status</th>
                        <th className="px-4 py-4 font-black">Session Date</th>
                        <th className="px-4 py-4 font-black">Institution</th>
                        <th className="px-4 py-4 font-black">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {sessionReport.recentSessions.map((row) => (
                        <tr key={row._id} className="transition-colors hover:bg-foreground/[0.02]">
                          <td className="px-4 py-5">
                            <div className="text-sm font-semibold text-foreground/85">{row.mentorName || "—"}</div>
                            <div className="mt-1 text-xs text-foreground/45">{row.mentorEmail || "—"}</div>
                          </td>
                          <td className="px-4 py-5">
                            <div className="text-sm font-semibold text-foreground/85">{row.studentName || "—"}</div>
                            <div className="mt-1 text-xs text-foreground/45">{formatInstitutionName(row.studentUniversity)}</div>
                          </td>
                          <td className="px-4 py-5">
                            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusClasses(row.status)}`}>
                              {row.status || "unknown"}
                            </span>
                          </td>
                          <td className="px-4 py-5 text-sm text-foreground/60">{formatDateTime(row.startTime || row.requestedAt)}</td>
                          <td className="px-4 py-5 text-sm text-foreground/60">{formatInstitutionName(row.mentorInstitution || row.studentUniversity)}</td>
                          <td className="px-4 py-5">
                            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${row.isFollowUp ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-600" : "border-border/60 bg-foreground/[0.03] text-foreground/60"}`}>
                              {row.isFollowUp ? "Follow-up" : "New Session"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionShell>
          </div>
        )}
      </div>
    </section>
  );
}
