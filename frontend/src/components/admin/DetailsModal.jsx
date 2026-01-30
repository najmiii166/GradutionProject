// frontend/src/components/admin/DetailsModal.jsx
import { motion, AnimatePresence } from "framer-motion";
import Button from "../Button";
import InfoItem from "./InfoItem";
import buildIdCardSrc from "../../utils/buildIdCardSrc";
import { X, ShieldAlert, CheckCircle, User, BookOpen, GraduationCap } from "lucide-react";
import { faculties } from "../../constants/systemData";

export default function DetailsModal({
  modalUser,
  modalProfile,
  detailLoading,
  closeDetails,
  handleApprove,
  handleReject,
}) {
    const getFacultyName = (key) => {
  return faculties.find(f => f.key === key)?.name || key || "—";
};

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeDetails}
        className="absolute inset-0 bg-background/60 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl rounded-[2.5rem] bg-card border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* 1. Header with Gradient Accent */}
        <div className="px-8 py-8 border-b border-border/50 bg-foreground/[0.01] relative">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-500">
                   Verification / {modalUser?.role}
                </span>
              </div>
              <h2 className="text-2xl font-light tracking-tight text-foreground">
                {modalUser?.fullName} <span className="italic font-serif text-foreground/40 text-lg">Details.</span>
              </h2>
              <p className="text-sm text-foreground/40">{modalUser?.email}</p>
            </div>
            <button
              onClick={closeDetails}
              className="p-2 rounded-full hover:bg-foreground/5 text-foreground/30 hover:text-foreground transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 2. Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {detailLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/30">Loading Profile...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Account Metadata Grid */}
              <div className="grid grid-cols-2 gap-6 bg-foreground/[0.02] p-5 rounded-3xl border border-border/50">
                <InfoItem label="Role" value={modalUser?.role} icon={<User size={12}/>} />
                <InfoItem label="Status" value={modalUser?.status || "pending"} />
                <InfoItem label="University" value={modalUser?.university || "—"} icon={<GraduationCap size={12}/>} />
                <InfoItem
                  label="Registered"
                  value={modalUser?.createdAt ? new Date(modalUser.createdAt).toLocaleDateString() : "—"}
                />
              </div>

              {/* Conditional Profile Logic */}
              {modalProfile && (
                <div className="space-y-6">
                 

                  {modalUser?.role === "student" ? (
                    <div className="grid grid-cols-2 gap-6">
                      <InfoItem
  label="Faculty / Program"
  value={getFacultyName(modalProfile.faculty)}
  icon={<BookOpen size={12}/>}
/>

                      <InfoItem label="Current Semester" value={modalProfile.semester} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-6">
                      <InfoItem label="Institution" value={modalProfile.institution} />
                      <InfoItem label="Experience" value={`${modalProfile.yearsOfExperience} Years`} />
                      <div className="col-span-2">
                        <InfoItem
  label="Faculty / Dept"
  value={`${getFacultyName(modalProfile.faculty)} — ${modalProfile.department}`}
/>

                      </div>
                    </div>
                  )}

                  {/* ID Image or Bio */}
                  {modalUser?.role === "student" && modalProfile.idCardUrl && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold">Verification ID</p>
                      <div className="rounded-2xl border border-border overflow-hidden bg-foreground/[0.02] p-2">
                        <img
                          src={buildIdCardSrc(modalProfile.idCardUrl)}
                          alt="Student ID Card"
                          className="w-full h-auto max-h-64 object-contain rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  {modalProfile.bio && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold">Professional Bio</p>
                      <p className="text-sm text-foreground/70 leading-relaxed italic font-serif">
                        "{modalProfile.bio}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Action Footer */}
        <div className="px-8 py-6 border-t border-border/50 bg-foreground/[0.01] flex justify-end gap-3">
          <button
            onClick={() => handleReject(modalUser._id)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all duration-300"
          >
            <ShieldAlert size={14} />
            Reject Account
          </button>
          <Button
          variant="Brand"
            className="flex items-center gap-2 px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl shadow-xl shadow-cyan-500/10 transition-all active:scale-95"
            onClick={() => handleApprove(modalUser._id)}
          >
            <CheckCircle size={14} />
            Approve User
          </Button>
        </div>
      </motion.div>
    </div>
  );
}