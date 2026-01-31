import { useState } from 'react';
import { api } from '../api/axios';
import { Send, AlertCircle } from 'lucide-react';

export default function SupportForm({ onSuccess }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!subject || !message) return setError('Please fill subject and message');
    setLoading(true);
    try {
      const { data } = await api.post('/support/create', { subject, message });
      setSubject('');
      setMessage('');
      if (onSuccess) onSuccess(data);
    } catch (err) {
      console.error('Support submit error', err);
      setError(err?.response?.data?.message || 'Failed to send support ticket');
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = "mt-1.5 w-full rounded-xl p-3 bg-foreground/[0.03] border border-border/50 text-foreground placeholder:text-foreground/20 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/40 transition-all text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Subject Field */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 ml-1">
          Subject
        </label>
        <input 
          value={subject} 
          onChange={(e) => setSubject(e.target.value)} 
          placeholder="What is this regarding?"
          className={inputStyles} 
        />
      </div>

      {/* Message Field */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 ml-1">
          Message
        </label>
        <textarea 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          rows={5} 
          placeholder="Describe your issue in detail..."
          className={`${inputStyles} resize-none`} 
        />
      </div>

      {/* Error Handling */}
      {error && (
        <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase tracking-tight bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <button 
          disabled={loading} 
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
        >
          {loading ? (
            'Transmitting...'
          ) : (
            <>
              <Send size={14} strokeWidth={2.5} />
              Send Ticket
            </>
          )}
        </button>
      </div>
    </form>
  );
}