import { motion, AnimatePresence } from "framer-motion";
import Button from "../Button";
import InfoItem from "./InfoItem";
import buildIdCardSrc from "../../utils/buildIdCardSrc";
import { 
  X, CheckCircle, User, BookOpen, 
  GraduationCap, Linkedin, Twitter, Facebook, Globe, Target 
} from "lucide-react";
import { faculties } from "../../constants/systemData";
import UserAvatar from "../UserAvatar";

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

  const getSubAreaName = (facultyKey, subKey) => {
    const faculty = faculties.find(f => f.key === facultyKey);
    return faculty?.subs?.find(s => s.key === subKey)?.name || subKey;
  };

  const socialIcons = {
    linkedin: <Linkedin size={14} className="text-[#0077b5]" />,
    x: <Twitter size={14} className="text-foreground" />,
    facebook: <Facebook size={14} className="text-[#1877f2]" />,
    website: <Globe size={14} className="text-cyan-500" />,
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeDetails}
        className="absolute inset-0 bg-background/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl rounded-[2.5rem] bg-card border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-8 py-8 border-b border-border/50 bg-foreground/[0.01] relative">
          <div className="flex justify-between items-start">
            <div className="space-y-1 flex items-start gap-3">
              <UserAvatar name={modalUser?.fullName} src={modalUser?.profileImageUrl} size={52} />
              <div>
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
            </div>
            <button onClick={closeDetails} className="p-2 rounded-full hover:bg-foreground/5 text-foreground/30 hover:text-foreground transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {detailLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/30">Loading Profile...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Main Info Grid */}
              <div className="grid grid-cols-2 gap-6 bg-foreground/[0.02] p-5 rounded-3xl border border-border/50">
                <InfoItem label="Role" value={modalUser?.role} icon={<User size={12}/>} />
                <InfoItem label="Status" value={modalUser?.status || "pending"} />
                <InfoItem 
                  label="Institution" 
                  value={modalUser?.role === 'mentor' ? modalProfile?.institution : modalUser?.university} 
                  icon={<GraduationCap size={12}/>} 
                />
                <InfoItem
                  label="Registered"
                  value={modalUser?.createdAt ? new Date(modalUser.createdAt).toLocaleDateString() : "—"}
                />
              </div>

              {modalProfile && (
                <div className="space-y-8">
                  {/* Role Specific Details */}
                  {modalUser?.role === "student" ? (
                    <div className="grid grid-cols-2 gap-6">
                      <InfoItem label="Faculty / Program" value={getFacultyName(modalProfile.faculty)} icon={<BookOpen size={12}/>} />
                      <InfoItem label="Current Semester" value={modalProfile.semester} />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <InfoItem label="Faculty / Dept" value={getFacultyName(modalProfile.faculty)} icon={<BookOpen size={12}/>} />
                        <InfoItem label="Experience" value={`${modalProfile.yearsOfExperience || 0} Years`} />
                      </div>

                      {/* Expertise Areas */}
                      {modalProfile.expertiseAreas?.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold flex items-center gap-2">
                            <Target size={12} className="text-cyan-500" /> Expertise Areas
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {modalProfile.expertiseAreas.map((area) => (
                              <span key={area} className="px-3 py-1.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-[11px] text-cyan-600 font-medium">
                                {getSubAreaName(modalProfile.faculty, area)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Social Links UI - FIXED VERSION */}
                      <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold">Social Networks</p>
                        <div className="flex flex-wrap gap-3">
                          {["linkedin", "x", "facebook", "website"].map((platform) => {
                            const url = modalProfile.socialLinks?.[platform];
                            const isActive = !!(url && url.trim() !== "");

                            const BadgeContent = (
                              <div className={`
                                flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all
                                ${isActive 
                                  ? "bg-foreground/[0.03] border-border/50 hover:border-cyan-500/30 hover:bg-foreground/[0.05] cursor-pointer group" 
                                  : "bg-foreground/[0.01] border-transparent opacity-20 cursor-not-allowed"}
                              `}>
                                {socialIcons[platform]}
                                <span className={`text-xs font-medium capitalize ${isActive ? "text-foreground/60 group-hover:text-foreground" : "text-foreground/40"}`}>
                                  {platform}
                                </span>
                              </div>
                            );

                            return isActive ? (
                              <a 
                                key={platform} 
                                href={url.startsWith('http') ? url : `https://${url}`} 
                                target="_blank" 
                                rel="noreferrer"
                              >
                                {BadgeContent}
                              </a>
                            ) : (
                              <div key={platform}>
                                {BadgeContent}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ID Image */}
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
                      <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold">Mentor Bio</p>
                      <div className="p-5 rounded-3xl bg-foreground/[0.01] border border-border/30 relative italic font-serif text-sm text-foreground/70 leading-relaxed">
                        <span className="text-3xl text-cyan-500/20 absolute top-2 left-2">“</span>
                        <p className="relative z-10 px-4">{modalProfile.bio}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-border/50 bg-foreground/[0.01] flex justify-end gap-3">
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-6 py-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-95"
            onClick={() => handleReject(modalUser._id)}
          >
            <X size={14} />
            Reject
          </Button>
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