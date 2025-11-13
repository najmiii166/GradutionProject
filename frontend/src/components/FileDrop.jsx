import { useState } from "react";


export default function FileDrop({ label = "Upload file", onFile, accept = "image/*" }) {
const [name, setName] = useState("");


const handle = (file) => {
if (!file) return;
setName(file.name);
onFile?.(file);
};


return (
<div className="space-y-1">
<label className="text-sm font-medium text-gray-700">{label}</label>
<label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-gray-300 bg-white px-3 py-3 hover:bg-gray-50">
<input type="file" className="hidden" accept={accept} onChange={(e) => handle(e.target.files?.[0])} />
<span className="text-sm text-gray-600">{name || "Choose an image (JPG/PNG/WebP) ≤ 10MB"}</span>
<span className="rounded-lg bg-gray-900 px-3 py-1 text-xs font-medium text-white">Browse</span>
</label>
</div>
);
}