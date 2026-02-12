import React from "react";
import { Sun, Moon, LogOut } from "lucide-react";

export default function MentorSettingsModal({ open, onClose, onLogout }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-xs shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-foreground/80">Theme</span>
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-yellow-400" />
            <Moon className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-500 text-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>

        <button onClick={onClose} className="mt-3 w-full py-2 text-sm text-slate-300 hover:text-white">
          Close
        </button>
      </div>
    </div>
  );
}
