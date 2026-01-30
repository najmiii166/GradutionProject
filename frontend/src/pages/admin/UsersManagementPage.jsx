// frontend/src/pages/admin/UsersManagementPage.jsx
import { motion } from "framer-motion";
import { UserCheck, UserX, Search, Mail, Calendar, GraduationCap } from "lucide-react";

export default function UsersManagementPage({ users, loading, view, setView }) {
  return (
    <section className="p-4 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto min-h-screen">
      
      {/* 1. TOP BAR: TABS & SEARCH */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="inline-flex p-1 bg-foreground/[0.03] border border-border/50 rounded-2xl backdrop-blur-md">
          {[
            { id: "verified", label: "Verified", icon: UserCheck, color: "text-emerald-500" },
            { id: "rejected", label: "Rejected", icon: UserX, color: "text-red-500" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`
                relative flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300
                ${view === tab.id ? "text-background shadow-lg" : "text-foreground/40 hover:text-foreground"}
              `}
            >
              {view === tab.id && (
                <motion.div 
                  layoutId="viewTab"
                  className={`absolute inset-0 rounded-xl ${view === 'verified' ? 'bg-emerald-500' : 'bg-red-500'}`}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon className="relative z-10 w-4 h-4" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Bar - Matches the premium input style */}
        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 group-focus-within:text-cyan-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search by name or email..."
            className="w-full bg-card border border-border/50 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all"
          />
        </div>
      </div>

      {/* 2. USERS TABLE CARD */}
      <motion.div 
        layout
        className="rounded-[2.5rem] border border-border bg-card shadow-xl overflow-hidden"
      >
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/30">Loading Directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-24 text-center">
            <h3 className="text-xl font-light text-foreground/40 italic font-serif">No {view} users found.</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-foreground/[0.01]">
                  <th className="py-6 px-8 text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40">User Identity</th>
                  <th className="py-6 px-8 text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40">Role</th>
                  <th className="py-6 px-8 text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40 hidden md:table-cell">Institution</th>
                  <th className="py-6 px-8 text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40 hidden lg:table-cell text-right">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((u, i) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    key={u._id}
                    className="group hover:bg-foreground/[0.01] transition-colors"
                  >
                    <td className="py-5 px-8">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground group-hover:text-cyan-500 transition-colors">
                          {u.fullName}
                        </span>
                        <span className="text-xs text-foreground/40 flex items-center gap-1.5 mt-0.5">
                          <Mail size={10} /> {u.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <span className={`
                        px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border
                        ${u.role === 'mentor' ? 'bg-violet-500/5 border-violet-500/20 text-violet-500' : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-500'}
                      `}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-5 px-8 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-xs text-foreground/60">
                        <GraduationCap size={14} className="opacity-30" />
                        {u.university || u.institution || "—"}
                      </div>
                    </td>
                    <td className="py-5 px-8 hidden lg:table-cell text-right">
                      <div className="flex items-center justify-end gap-2 text-xs text-foreground/40 font-mono">
                        <Calendar size={12} />
                        {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </section>
  );
}