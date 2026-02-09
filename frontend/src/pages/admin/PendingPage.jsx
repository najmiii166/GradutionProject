import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, Users, Eye, School } from "lucide-react";
import { universities } from "../../constants/systemData";
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
  // Ensure we are filtering correctly and handling empty states
  const filteredPending = Array.isArray(pending)
    ? pending.filter((u) => (activeRole ? u.role === activeRole : true))
    : [];

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
                ${activeRole === role.id ? "text-background" : "text-foreground/50 hover:text-foreground"}
              `}
            >
              {activeRole === role.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-foreground rounded-full shadow-lg"
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
        className="rounded-[2rem] border border-border bg-card shadow-xl overflow-hidden min-h-[400px] relative"
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="py-40 flex flex-col items-center justify-center gap-4"
            >
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-foreground/40 uppercase tracking-widest font-bold">Fetching Profiles...</p>
            </motion.div>
          ) : filteredPending.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="py-40 text-center"
            >
              <div className="w-16 h-16 bg-foreground/[0.03] rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                <UserCheck className="w-8 h-8 text-foreground/20" />
              </div>
              <h3 className="text-lg font-light">Inbox <span className="italic font-serif text-primary">Clear.</span></h3>
              <p className="text-sm text-foreground/40">No pending {activeRole}s at this time.</p>
            </motion.div>
          ) : (
            <motion.div 
              key={activeRole} // Re-animates the whole table when switching roles
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="overflow-x-auto"
            >
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
                  <AnimatePresence>
                    {filteredPending.map((u, i) => (
                      <motion.tr 
                        key={u._id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 100, 
                          damping: 15,
                          delay: i * 0.04 
                        }}
                        className="group hover:bg-foreground/[0.02] transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-violet-500/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                              {u.fullName?.charAt(0)}
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
                            <School className="w-3.5 h-3.5 opacity-40 text-primary" />
                            <span>
                              {(() => {
                                const key = u.institution || u.university || u.profile?.institution || u.mentorProfile?.institution;
                                const match = universities.find((x) => String(x.key) === String(key));
                                return match ? match.name : "Independent";
                              })()}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => openDetails(u)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background text-xs font-bold hover:border-primary/50 hover:shadow-lg transition-all active:scale-95"
                          >
                            <Eye size={14} className="text-primary" />
                            View Profile
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <Toast
        message={toast}
        onClose={() => setToast(null)}
        type={toast?.toLowerCase().includes("success") || toast?.toLowerCase().includes("approved") ? "success" : "error"}
      />

      {selectedUser && (
        <DetailsModal
          modalUser={modalUser}
          modalProfile={modalProfile}
          detailLoading={detailLoading}
          closeDetails={closeDetails}
          handleApprove={handleApprove}
          handleReject={handleReject}
        />
      )}
    </section>
  );
}