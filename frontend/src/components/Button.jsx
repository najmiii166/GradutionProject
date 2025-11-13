export default function Button({ children, className = "", loading=false, ...props }) {
return (
<button
{...props}
className={`relative inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60 ${className}`}
>
{loading && <span className="absolute left-3 h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent"></span>}
<span>{children}</span>
</button>
);
}