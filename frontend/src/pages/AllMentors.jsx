import { useEffect, useState } from "react";
import { api, setAuthToken } from "../api/axios";
import MentorCard from "../components/MentorCard";
import MentorModal from "../components/MentorModal";
import Toast from "../components/Toast";
import { motion } from "framer-motion";
import { Search, RefreshCcw, ArrowLeft } from "lucide-react";
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

  // Filtering logic
  const filteredMentors = mentors.filter((m) => {
    const exp = parseInt(m.yearsOfExperience, 10) || 0;

    const matchesSearch = m.user.fullName
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesUniversity = universityFilter
      ? m.user.university === universityFilter
      : true;

    const matchesDay = dayFilter
      ? m.availability?.some((slot) => slot.day === dayFilter)
      : true;

    const matchesExperience = experienceFilter
      ? exp >= parseInt(experienceFilter, 10)
      : true;

    return matchesSearch && matchesUniversity && matchesDay && matchesExperience;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-slate-800/60 border border-slate-700 
                     hover:bg-slate-800 transition shadow-md hover:shadow-sky-400/20"
        >
          <ArrowLeft className="w-5 h-5 text-sky-300" />
        </button>

        <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
          Matching Mentors
        </h1>
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
        <p className="text-slate-400 text-sm">Loading mentors...</p>
      ) : filteredMentors.length === 0 ? (
        <p className="text-slate-400">No mentors match your criteria.</p>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
        >
          {filteredMentors.map((mentor) => (
            <MentorCard
              key={mentor._id}
              mentor={mentor}
              onClick={() => setSelectedMentor(mentor)}   // updated
            />
          ))}
        </motion.div>
      )}

      {/* Modal */}
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
