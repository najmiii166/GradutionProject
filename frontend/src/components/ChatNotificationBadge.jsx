// src/components/ChatNotificationBadge.jsx
import { useContext, useMemo } from "react";
import { SocketContext } from "../Contexts/SocketContext";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatNotificationBadge() {
  const { unreadCounts } = useContext(SocketContext) || {};

  // Derive total unread directly from unreadCounts so the badge
  // re-renders whenever the object changes.
  const totalUnread = useMemo(() => {
    if (!unreadCounts || typeof unreadCounts !== "object") return 0;
    return Object.values(unreadCounts).reduce(
      (acc, count) => acc + (count || 0),
      0
    );
  }, [unreadCounts]);

  return (
    <AnimatePresence>
      {totalUnread > 0 ? (
        <motion.div
          key="badge"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 shadow-lg shadow-rose-500/40"
        >
          <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative text-[9px] font-bold text-white leading-none">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        </motion.div>
      ) : (
        <motion.div
          key="dot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          className="absolute top-0 right-0 h-2 w-2 rounded-full bg-gray-400"
        />
      )}
    </AnimatePresence>
  );
}
