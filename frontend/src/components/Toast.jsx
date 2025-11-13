import { useEffect, useState } from "react";


export default function Toast({ message, type = "info", onClose, duration = 3000 }) {
const [open, setOpen] = useState(Boolean(message));
useEffect(() => {
if (!message) return;
setOpen(true);
const t = setTimeout(() => { setOpen(false); onClose?.(); }, duration);
return () => clearTimeout(t);
}, [message, duration, onClose]);


if (!open || !message) return null;
const tone = type === "success" ? "bg-emerald-600" : type === "error" ? "bg-rose-600" : "bg-gray-800";
return (
<div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2 text-white shadow-lg ${tone}`}>
{message}
</div>
);
}