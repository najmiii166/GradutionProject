// // frontend/src/pages/AdminTickets.jsx
// import { useEffect, useState } from 'react';
// import { Navigate } from 'react-router-dom';
// import { api, setAuthToken } from '../api/axios';

// export default function AdminTickets() {
//   const token = localStorage.getItem('token');
//   const role = localStorage.getItem('role');
//   if (!token) return <Navigate to="/login" />;
//   if (role !== 'admin') return <Navigate to="/" />;

//   setAuthToken(token);

//   const [tickets, setTickets] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(()=>{(async ()=>{
//     try {
//       const { data } = await api.get('/admin/tickets');
//       setTickets(data.tickets || []);
//     } catch (err) {
//       console.error('Load tickets', err);
//     } finally { setLoading(false); }
//   })();}, []);

//   const markResolved = async (id) => {
//     try {
//       const { data } = await api.patch(`/admin/tickets/${id}`, { status: 'resolved' });
//       setTickets((prev)=>prev.map(t=>t._id===id?data.ticket:t));
//     } catch (err) {
//       console.error('Failed update', err);
//     }
//   };

//   return (
//     <div className="p-6 min-h-screen bg-slate-950 text-white">
//       <h2 className="text-2xl font-semibold mb-4">Support Tickets</h2>
//       {loading ? <div>Loading...</div> : (
//         <div className="overflow-x-auto">
//           <table className="min-w-full text-left text-sm">
//             <thead>
//               <tr className="text-slate-300">
//                 <th className="px-3 py-2">Sender</th>
//                 <th className="px-3 py-2">Role</th>
//                 <th className="px-3 py-2">Subject</th>
//                 <th className="px-3 py-2">Message</th>
//                 <th className="px-3 py-2">Status</th>
//                 <th className="px-3 py-2">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {tickets.map(t=> (
//                 <tr key={t._id} className="border-t border-slate-800">
//                   <td className="px-3 py-2">{t.user?.fullName || t.senderName}</td>
//                   <td className="px-3 py-2">{t.senderRole}</td>
//                   <td className="px-3 py-2">{t.subject}</td>
//                   <td className="px-3 py-2 max-w-xl">{t.message}</td>
//                   <td className="px-3 py-2">{t.status}</td>
//                   <td className="px-3 py-2">
//                     {t.status !== 'resolved' && (
//                       <button onClick={()=>markResolved(t._id)} className="px-2 py-1 bg-sky-500 rounded">Mark as Resolved</button>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }
