// frontend/src/pages/admin/PendingPage.jsx
import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, Users, Eye, Search, Clock, School } from "lucide-react";
import Toast from "../../components/Toast";
import DetailsModal from "../../components/admin/DetailsModal";

export default function PendingPage({
  pending,
  loading,
  activeRole,
  setActiveRole,
  openDetails,
  selectedUser,
  detailLoading,
  modalUser,
  modalProfile,
  handleApprove,
  handleReject,
  closeDetails,
  toast,
  setToast,
  pendingCounts,
}) {
  return (
    <section className="p-4 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto min-h-screen">
      
      {/* 1. SELECTION TABS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="inline-flex p-1.5 bg-foreground/[0.03] border border-border/50 rounded-full backdrop-blur-md">
          {[
            { id: "student", label: "Students", count: pendingCounts.students, icon: Users },
            { id: "mentor", label: "Mentors", count: pendingCounts.mentors, icon: UserCheck },
          ].map((role) => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              className={`
                relative flex items-center gap-3 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                ${activeRole === role.id ? "text-background shadow-lg" : "text-foreground/50 hover:text-foreground"}
              `}
            >
              {activeRole === role.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-foreground rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <role.icon className="relative z-10 w-4 h-4" />
              <span className="relative z-10">{role.label}</span>
              <span className={`relative z-10 px-2 py-0.5 rounded-full text-[10px] font-bold 
                ${activeRole === role.id ? "bg-background/20 text-background" : "bg-foreground/10 text-foreground/40"}`}>
                {role.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. TABLE CONTAINER */}
      <motion.div 
        layout
        className="rounded-[2rem] border border-border bg-card shadow-xl overflow-hidden"
      >
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-foreground/40 uppercase tracking-widest font-bold">Fetching Profiles...</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-foreground/[0.03] rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
              <UserCheck className="w-8 h-8 text-foreground/20" />
            </div>
            <h3 className="text-lg font-light">Inbox <span className="italic font-serif text-cyan-500">Clear.</span></h3>
            <p className="text-sm text-foreground/40">No pending {activeRole} registrations at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-foreground/[0.01]">
                  <th className="py-5 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40">Identity</th>
                  <th className="py-5 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40 hidden md:table-cell">Contact</th>
                  <th className="py-5 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40 hidden lg:table-cell">Institution</th>
                  <th className="py-5 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {pending.map((u, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={u._id}
                    className="group hover:bg-foreground/[0.02] transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 font-bold text-xs">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground leading-none">{u.fullName}</p>
                          <span className="text-[10px] text-foreground/30 uppercase tracking-wider">{u.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell">
                      <p className="text-sm text-foreground/60">{u.email}</p>
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-sm text-foreground/60">
                        <School className="w-3.5 h-3.5 opacity-40" />
                        {u.university || u.institution || "Independent"}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openDetails(u)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background text-xs font-bold hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all group-hover:bg-cyan-500 group-hover:text-background group-hover:border-cyan-500"
                      >
                        <Eye size={14} />
                        View Profile
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <Toast
        message={toast}
        onClose={() => setToast(null)}
        type={toast?.includes("approved") || toast?.includes("rejected") ? "success" : "error"}
      />

      {selectedUser && (
        <DetailsModal
          {...{
            modalUser,
            modalProfile,
            detailLoading,
            closeDetails,
            handleApprove,
            handleReject,
          }}
        />
      )}
    </section>
  );
}