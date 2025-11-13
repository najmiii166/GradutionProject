export default function Input({ label, hint, type = "text", className = "", ...props }) {
return (
<div className="space-y-1">
{label && <label className="text-sm font-medium text-gray-700">{label}</label>}
<input
type={type}
className={`w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none ring-blue-500 focus:ring-2 ${className}`}
{...props}
/>
{hint && <p className="text-xs text-gray-500">{hint}</p>}
</div>
);
}