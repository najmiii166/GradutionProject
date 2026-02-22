// frontend/src/pages/admin/AdminTickets.jsx
import { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { 
  Ticket, 
  CheckCircle2, 
  Clock
} from "lucide-react";
import { api } from '../../api/axios';
import UserAvatar from "../../components/UserAvatar";

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/tickets');
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Load tickets error:', err);
    } finally {
      setLoading(false);
    }
  }

  const markResolved = async (id) => {
    try {
      const { data } = await api.patch(`/admin/tickets/${id}`, { status: 'resolved' });
      setTickets((prev) => prev.map(t => t._id === id ? data.ticket : t));
    } catch (err) {
      console.error('Failed update', err);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'resolved') return t.status === 'resolved';
    if (filter === 'pending') return t.status !== 'resolved';
    return true;
  });

  return (
    <section className="p-8 h-full overflow-y-auto bg-background custom-scrollbar">
      
      {/* 1. HEADER SECTION */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-cyan-500">
            <Ticket size={18} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Support Terminal</span>
          </div>
          <h2 className="text-3xl font-light tracking-tight text-foreground">
            Service <span className="italic font-serif text-foreground/40">Queue.</span>
          </h2>
          <p className="text-xs text-foreground/40 font-medium uppercase tracking-widest">
            {tickets.filter(t => t.status !== 'resolved').length} Active incidents requiring attention
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-foreground/[0.03] p-1 rounded-xl border border-border self-start md:self-auto">
          {['all', 'pending', 'resolved'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                filter === type 
                ? 'bg-background text-cyan-500 shadow-sm border border-border/50' 
                : 'text-foreground/40 hover:text-foreground'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </header>

      {/* 2. DATA GRID */}
      <div className="rounded-[2.5rem] border border-border bg-card shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-border bg-foreground/[0.01]">
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40">Communication Logs</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/[0.01] text-[10px] uppercase tracking-widest text-foreground/40 border-b border-border">
                <th className="py-5 px-8 font-bold">Inquirer</th>
                <th className="py-5 px-8 font-bold">Classification</th>
                <th className="py-5 px-8 font-bold">Subject & Narrative</th>
                <th className="py-5 px-8 font-bold">Status</th>
                <th className="py-5 px-8 font-bold text-right">Operation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-foreground/30 animate-pulse tracking-widest uppercase text-[10px] font-bold">
                    Syncing Support Database...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-foreground/30 italic font-serif text-lg">
                    No incidents found in this sector.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t._id} className="hover:bg-foreground/[0.01] transition-colors group">
                    <td className="py-6 px-8 text-foreground">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={t.user?.fullName || t.senderName}
                          src={t.user?.profileImageUrl || ""}
                          size={32}
                          showInitials={false}
                        />
                        <div>
                          <div className="font-semibold group-hover:text-cyan-500 transition-colors uppercase text-[11px] tracking-wider">
                            {t.user?.fullName || t.senderName}
                          </div>
                          <div className="text-[10px] text-foreground/40 lowercase">{t.senderRole || 'guest'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <div className="text-xs font-medium text-foreground/60">{t.subject}</div>
                    </td>
                    <td className="py-6 px-8 max-w-xs">
                      <div className="text-[11px] text-foreground/50 leading-relaxed line-clamp-2 italic font-serif">
                        "{t.message}"
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      {t.status === 'resolved' ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tighter text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg w-fit">
                          <CheckCircle2 size={10} /> Resolved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tighter text-orange-500 bg-orange-500/10 px-2 py-1 rounded-lg w-fit">
                          <Clock size={10} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-6 px-8 text-right">
                      {t.status !== 'resolved' && (
                        <button 
                          onClick={() => markResolved(t._id)}
                          className="px-4 py-2 rounded-xl bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all shadow-lg shadow-black/5 active:scale-95"
                        >
                          Finalize
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}