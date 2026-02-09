// src/pages/AllMentors.jsx
import { useEffect, useState } from "react";
import { api, setAuthToken } from "../api/axios";
import MentorCard, { MentorCardSkeleton } from "../components/MentorCard";
import MentorModal from "../components/MentorModal";
import Toast from "../components/Toast";
import { motion } from "framer-motion";
import { Search, RefreshCcw, ArrowLeft, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AllMentors() {
  const token = localStorage.getItem("token");
  setAuthToken(token);

  const navigate = useNavigate();

  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");

  const activeCount = requests.filter((r) =>
    ["pending", "upcoming"].includes(r.status)
  ).length;

  useEffect(() => {
    (async () => {
      try {
        const [matches, reqs] = await Promise.all([
          api.get("/student/matches"),
          api.get("/requests/student"),
        ]);
        setMentors(matches.data.mentors || []);
        setRequests(reqs.data || []);
      } catch (err) {
        console.error("Load mentors error", err);
        setToast("Failed to load mentors");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRequestSent = async () => {
    setToast("✅ Request sent successfully!");
    const { data } = await api.get("/requests/student");
    setRequests(data || []);
  };

  const filteredMentors = mentors.filter((m) => {
    const exp = parseInt(m.yearsOfExperience, 10) || 0;
    const matchesSearch = m.user.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesUniversity = universityFilter ? m.user.university === universityFilter : true;
    const matchesDay = dayFilter ? m.availability?.some((slot) => slot.day === dayFilter) : true;
    const matchesExperience = experienceFilter ? exp >= parseInt(experienceFilter, 10) : true;
    return matchesSearch && matchesUniversity && matchesDay && matchesExperience;
  });

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-10 selection:bg-cyan-500/30">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="group p-2.5 rounded-xl border border-border/40 bg-foreground/[0.02] hover:bg-foreground/[0.05] hover:border-cyan-500/40 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-foreground/60 group-hover:text-cyan-500 transition-colors" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold uppercase tracking-tighter ">
              Matching <span className="text-cyan-500">Mentors</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/30">
               {filteredMentors.length} Verified Mentors
            </p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-foreground/[0.02] border border-border/40 text-[11px] font-bold  tracking-widest focus:outline-none focus:border-cyan-500/50 focus:bg-foreground/[0.04] transition-all"
          />
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="flex flex-wrap items-center gap-3 mb-8 p-2 border-b border-border/20">
        <div className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-cyan-500/60 bg-cyan-500/5 rounded-lg border border-cyan-500/10">
          <Filter size={12} /> Parameters
        </div>

        <select
          value={universityFilter}
          onChange={(e) => setUniversityFilter(e.target.value)}
          className="bg-transparent text-[10px] font-bold uppercase tracking-widest py-1.5 focus:outline-none cursor-pointer border-b border-transparent hover:border-cyan-500/40 transition-all"
        >
          <option value="" className="bg-background"> Universities</option>
          {[...new Set(mentors.map((m) => m.user.university))].map((u) => (
            <option key={u} value={u} className="bg-background">{u}</option>
          ))}
        </select>

        <select
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
          className="bg-transparent text-[10px] font-bold uppercase tracking-widest py-1.5 focus:outline-none cursor-pointer border-b border-transparent hover:border-cyan-500/40 transition-all"
        >
          <option value="" className="bg-background">Availability</option>
          {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d) => (
            <option key={d} value={d} className="bg-background">{d}</option>
          ))}
        </select>

        <select
          value={experienceFilter}
          onChange={(e) => setExperienceFilter(e.target.value)}
          className="bg-transparent text-[10px] font-bold uppercase tracking-widest py-1.5 focus:outline-none cursor-pointer border-b border-transparent hover:border-cyan-500/40 transition-all"
        >
          <option value="" className="bg-background">Experience</option>
          {[1, 3, 5, 10].map((y) => (
            <option key={y} value={y} className="bg-background">{y}+ Years</option>
          ))}
        </select>

        <button
          onClick={() => {
            setSearch("");
            setUniversityFilter("");
            setDayFilter("");
            setExperienceFilter("");
          }}
          className="ml-auto flex items-center gap-2 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-foreground/40 hover:text-rose-500 transition-colors"
        >
          <RefreshCcw className="w-3 h-3" /> Reset 
        </button>
      </div>

      {/* Filters Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 mb-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center gap-3">

          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by mentor name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-full bg-slate-800/60 border border-slate-700 text-sm focus:border-sky-500"
            />
          </div>

          <select
            value={universityFilter}
            onChange={(e) => setUniversityFilter(e.target.value)}
            className="px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700 text-sm"
          >
            <option value="">University</option>
            {[...new Set(mentors.map((m) => m.user?.university).filter(Boolean))].map((u, idx) => (
              <option key={`${u}-${idx}`} value={u}>{u}</option>
            ))}
          </select>

          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700 text-sm"
          >
            <option value="">Availability</option>
            {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d, idx) => (
              <option key={`${d}-${idx}`} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            className="px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700 text-sm"
          >
            <option value="">Experience</option>
            {[1, 2, 3, 5, 10, 15].map((y, idx) => (
              <option key={`${y}-${idx}`} value={y}>{y}+ years</option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearch("");
              setUniversityFilter("");
              setDayFilter("");
              setExperienceFilter("");
            }}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs text-sky-400 hover:text-sky-300"
          >
            <RefreshCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {/* Mentors List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <MentorCardSkeleton key={idx} />
          ))}
        </div>
      ) : filteredMentors.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-border/40 bg-foreground/[0.01]">
          <p className="text-[15px] font-semibold uppercase tracking-widest text-foreground/20">Zero matches found within current parameters.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredMentors.map((mentor) => (
            <MentorCard
              key={mentor._id}
              mentor={mentor}
              onClick={() => setSelectedMentor(mentor)}
            />
          ))}
        </motion.div>
      )}

      {/* MODAL */}
      {selectedMentor && (
        <MentorModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
          onRequestSent={handleRequestSent}
          disabled={
            activeCount >= 2 ||
            requests.some(
              (r) =>
                ["pending", "upcoming", "ongoing"].includes(r.status) &&
                String(r.mentorId?._id || r.mentorId) === String(selectedMentor._id)
            )
          }
        />
      )}

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}