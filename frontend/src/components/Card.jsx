export default function Card({ children, className = "" }) {
return (
<div className={`w-full max-w-md rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur ${className}`}>
{children}
</div>
);
}