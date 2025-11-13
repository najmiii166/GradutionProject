export default function Select({ label, options = [], className = "", ...props }) {
return (
<div className="space-y-1">
{label && <label className="text-sm font-medium text-gray-700">{label}</label>}
<select
className={`w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none ring-blue-500 focus:ring-2 ${className}`}
{...props}
>
<option value="">Select…</option>
{options.map((o) => (
<option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
))}
</select>
</div>
);
}