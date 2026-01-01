import React from 'react';

function formatDateTime(d) {
  if (!d) return '-';
  const dt = new Date(d);
  return dt.toLocaleString();
}

export default function SessionCard({ session }) {
  const now = new Date();
  const start = session.startTime ? new Date(session.startTime) : null;
  const end = session.endTime ? new Date(session.endTime) : null;

  const isLive = start && end && now >= start && now <= end;

  return (
    <div className="p-4 rounded-md bg-slate-800 border border-slate-700 mb-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-300">{session.subject || 'Session'}</div>
          <div className="text-white font-medium">
            {start ? start.toLocaleDateString() : '-'}
          </div>
          <div className="text-xs text-slate-400">
            {start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
            {' '}—{' '}
            {end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Status</div>
          <div className="text-sm font-semibold">{session.status}</div>
          {isLive && (
            <div className="mt-2 inline-block bg-rose-500 text-white text-xs px-2 py-1 rounded">Live Now</div>
          )}
        </div>
      </div>
      {session.studentId && (
        <div className="mt-3 text-xs text-slate-300">Student: {session.studentId.fullName || session.studentId}</div>
      )}
    </div>
  );
}
