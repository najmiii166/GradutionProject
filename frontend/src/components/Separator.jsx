export default function Separator({ label = "or" }) {
return (
<div className="relative my-4 text-center">
<div className="h-px w-full bg-gray-200"></div>
<span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 text-xs text-gray-500">{label}</span>
</div>
);
}