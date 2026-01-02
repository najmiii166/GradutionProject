import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { setAuthToken } from '../api/axios';
import SupportForm from '../components/SupportForm';

export default function Support() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" />;
  if (!['student','mentor','admin'].includes(role)) return <Navigate to="/" />;

  setAuthToken(token);

  const [success, setSuccess] = useState(null);

  return (
    <div className="p-6 min-h-screen bg-slate-950 text-white">
      <h2 className="text-2xl font-semibold mb-4">Support</h2>
      <p className="text-sm text-slate-300 mb-4">If you encounter issues, send a message to the admin team.</p>
      <SupportForm onSuccess={(d)=>setSuccess('Ticket sent successfully')} />
      {success && <div className="mt-4 text-green-400">{success}</div>}
    </div>
  );
}
