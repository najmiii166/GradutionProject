import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, setAuthToken } from '../api/axios';
import TimeRemaining from '../components/TimeRemaining';

export default function MentorStudents() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" />;
  if (role !== 'mentor' && role !== 'admin') return <Navigate to='/' />;

  setAuthToken(token);

  const [active, setActive] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{(async ()=>{
    try {
      const mentorId = role === 'mentor' ? user._id : user._id; // admin may pass different id later
      const { data } = await api.get(`/enrollments/mentor/${mentorId}`);
      setActive(data.active || []);
      setPast(data.past || []);
    } catch (err) {
      console.error('Load enrollments', err);
    } finally { setLoading(false); }
  })();}, []);

  return (
    <div className="p-6 min-h-screen bg-slate-950 text-white">
      <h2 className="text-2xl font-semibold mb-4">My Students</h2>
      {loading ? <div>Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section>
            <h3 className="text-lg font-medium mb-3">Active Students</h3>
            {active.length === 0 && <div className="text-slate-400">No active students.</div>}
            {active.map(e => (
              <div key={e._id} className="p-3 mb-3 rounded bg-slate-800 border border-slate-700">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{e.student?.fullName || 'Student'}</div>
                    <div className="text-xs text-slate-400">Started: {new Date(e.startDate).toLocaleDateString()}</div>
                    <div className="text-xs text-slate-400">Duration: {e.durationMonths} month(s)</div>
                  </div>
                  <div className="text-right">
                    <TimeRemaining expiryDate={e.expiryDate} />
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section>
            <h3 className="text-lg font-medium mb-3">Alumni / Past Students</h3>
            {past.length === 0 && <div className="text-slate-400">No past students.</div>}
            {past.map(e => (
              <div key={e._id} className="p-3 mb-3 rounded bg-slate-800 border border-slate-700">
                <div className="font-semibold">{e.student?.fullName || 'Student'}</div>
                <div className="text-xs text-slate-400">Started: {new Date(e.startDate).toLocaleDateString()}</div>
                <div className="text-xs text-slate-400">Duration: {e.durationMonths} month(s)</div>
                <div className="text-xs text-slate-400">Expired: {new Date(e.expiryDate).toLocaleDateString()}</div>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
