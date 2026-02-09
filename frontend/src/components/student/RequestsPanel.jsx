import RequestCard from "../RequestCard";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Zap } from "lucide-react";

export default function RequestsPanel({
    requests,
    user,
    api,
    cancelRequest,
    deleteRejected,
    setToast,
    activeFilter,
    setActiveFilter,
    navigate,
}) {
    const activeRequests = requests.filter((r) => ["pending", "upcoming", "ongoing"].includes(r.status));

    const filteredList = requests.filter(r => {
        if (activeFilter === "upcoming") return ["upcoming", "ongoing"].includes(r.status);
        return r.status === activeFilter;
    });

    return (
        <section className="relative group flex flex-col h-full min-h-[550px] p-6 rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl transition-all duration-300">
            {/* 1. Header Area with Gradient Accent */}
            <div className="relative z-10 flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-sm font-bold text-foreground tracking-tight uppercase flex items-center gap-2 italic">
                        <Zap size={14} className="text-cyan-500" fill="currentColor" />
                        Your <span className="text-cyan-500 not-italic">Sessions</span>
                    </h2>
                    <p className="text-[10px] text-foreground/40 font-medium uppercase tracking-[0.2em] mt-1.5">
                        Track your progress
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-tighter bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 shadow-sm shadow-cyan-500/10">
                        Active: {activeRequests.length}/2
                    </p>
                </div>
            </div>

            {/* 2. Premium Tab System (Segmented Control Style) */}
            <div className="relative z-10 flex p-1.5 gap-1.5 bg-foreground/[0.03] border border-border/40 rounded-[1.2rem] mb-6">
                {["pending", "upcoming", "rejected"].map((tab) => (
                    <button
                        key={tab}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-[0.98] ${
                            activeFilter === tab
                                ? "bg-foreground text-background shadow-xl shadow-black/20"
                                : "text-foreground/40 hover:text-foreground hover:bg-foreground/5"
                        }`}
                        onClick={() => setActiveFilter(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* 3. Scrollable Content Area */}
            <div className="relative z-10 flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                <AnimatePresence mode="popLayout" initial={false}>
                    {filteredList.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-full flex flex-col items-center justify-center text-center py-20"
                        >
                            <div className="p-5 rounded-[1.5rem] bg-foreground/[0.02] border border-dashed border-border/60 mb-4 text-foreground/10">
                                <Inbox size={40} strokeWidth={1} />
                            </div>
                            <p className="text-[10px] font-bold text-foreground/20 uppercase tracking-[0.3em]">
                                No {activeFilter} sessions
                            </p>
                        </motion.div>
                    ) : (
                        filteredList.map((r) => (
                            <RequestCard
                                key={r._id}
                                r={r}
                                user={user}
                                navigate={navigate}
                                api={api}
                                cancelRequest={cancelRequest}
                                deleteRejected={deleteRejected}
                                setToast={setToast}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Subtle bottom fade to indicate more content */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/10 to-transparent pointer-events-none rounded-b-[2rem]" />
        </section>
    );
}