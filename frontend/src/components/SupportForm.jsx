import { useState } from 'react';
import { api } from '../api/axios';

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

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-xl">
      <div>
        <label className="block text-sm font-medium text-slate-300">Subject</label>
        <input value={subject} onChange={(e)=>setSubject(e.target.value)} className="mt-1 w-full rounded-md p-2 bg-slate-800 text-white" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300">Message</label>
        <textarea value={message} onChange={(e)=>setMessage(e.target.value)} rows={6} className="mt-1 w-full rounded-md p-2 bg-slate-800 text-white" />
      </div>
      {error && <div className="text-rose-400 text-sm">{error}</div>}
      <div>
        <button disabled={loading} className="px-4 py-2 bg-sky-500 rounded-md text-white">{loading ? 'Sending...' : 'Send to Support'}</button>
      </div>
    </form>
  );
}
