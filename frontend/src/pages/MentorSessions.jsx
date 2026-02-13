import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, setAuthToken } from '../api/axios';
import SessionCard from '../components/SessionCard';

export default function MentorSessions() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" />;
  if (role !== 'mentor' && role !== 'admin') return <Navigate to='/' />;

  setAuthToken(token);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{(async ()=>{
    try {
      const mentorId = role === 'mentor' ? user._id : user._id; // admin can pass id via query later
      const { data } = await api.get(`/sessions/mentor/${mentorId}`);
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Load sessions', err);
    } finally { setLoading(false); }
  })();}, []);

  return (
    <div className="p-6 min-h-screen bg-background text-foreground">
      <h2 className="text-2xl font-semibold mb-4">My Sessions</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {sessions.length === 0 && (
            <div className="text-slate-400">No sessions found.</div>
          )}
          {sessions.map((s) => (
            <SessionCard key={s._id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}
