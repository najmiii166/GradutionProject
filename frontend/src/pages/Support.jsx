// src/pages/Support.jsx
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { setAuthToken } from '../api/axios';
import SupportForm from '../components/SupportForm';
import { motion } from "framer-motion";
import { CheckCircle2, ShieldQuestion } from "lucide-react";

export default function Support() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token) return <Navigate to="/login" />;
  if (!['student', 'mentor', 'admin'].includes(role)) return <Navigate to="/" />;

  setAuthToken(token);
  const [success, setSuccess] = useState(null);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-xl">
        
        {/* 1. COMPACT HEADER */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 mb-4 border border-cyan-500/20"
          >
            <ShieldQuestion size={28} strokeWidth={1.5} />
          </motion.div>
          
          <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground italic">
            Help <span className="text-cyan-500 not-italic">Center</span>
          </h2>
          <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/30 font-bold mt-1">
            Secure Support Channel
          </p>
        </div>

        {/* 2. COMPACT FORM CARD */}
        <motion.div 
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-background border border-border/60 rounded-[2rem] p-8 shadow-2xl relative"
        >
          <div className="relative z-10">
            <p className="text-xs text-center text-foreground/40 mb-6 leading-relaxed px-4">
              Describe your issue below. Our team typically responds within 2-4 hours.
            </p>

            {/* THE FORM */}
            <SupportForm onSuccess={(d) => setSuccess('Ticket Transmitted')} />

            {/* SUCCESS FEEDBACK - Minimalist */}
            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
              >
                <CheckCircle2 size={16} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest">{success}</span>
              </motion.div>
            )}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}