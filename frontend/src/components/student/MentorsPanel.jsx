// src/components/student/MentorsPanel.jsx
import MentorCard from "../MentorCard";
import { Search, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Ensure this is imported

export default function MentorsPanel({ mentors, loading, onSelect }) {
  const navigate = useNavigate();

  return (
    <section className="col-span-1 lg:col-span-2 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-xl flex flex-col h-full transition-colors duration-300">
      
      {/* Header with Admin-Style Intelligence Branding */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
            <Search size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground/80">
              Matched <span className="text-cyan-500 italic font-serif lowercase tracking-normal text-base font-medium">Mentors.</span>
            </h2>
            <div className="flex items-center gap-1.5">
               
            </div>
          </div>
        </div>

        {/* The "See More" Link */}
        <button 
          onClick={() => navigate("/mentors")} 
          className="group flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-cyan-500 hover:text-cyan-400 transition-all border-b border-cyan-500/0 hover:border-cyan-500/40 pb-0.5"
        >
          See All
          <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Grid Content */}
      <div className="flex-1 min-h-0">
        {!loading && mentors.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-40 flex items-center justify-center border border-dashed border-border/50 rounded-xl"
          >
            <p className="text-[11px] uppercase tracking-widest text-foreground/40 font-bold">
              No matching profiles found
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {mentors.slice(0, 3).map((m, idx) => (
              <motion.div
                key={m._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <MentorCard mentor={m} onClick={() => onSelect(m)} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}