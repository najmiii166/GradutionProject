import { useState } from "react";
import { Upload, FileCheck } from "lucide-react";

export default function FileDrop({ label = "Upload file", onFile, accept = "image/*" }) {
  const [name, setName] = useState("");

  const handle = (file) => {
    if (!file) return;
    setName(file.name);
    onFile?.(file);
  };

  return (
    <div className="space-y-2">
      {/* Label styled like your learning goals header */}
      <label className="text-xs font-medium uppercase tracking-widest text-foreground/40 px-1">
        {label}
      </label>

      <label 
        className={`
          flex cursor-pointer items-center justify-between gap-3 
          rounded-2xl border border-dashed border-border 
          bg-background px-4 py-3.5 
          hover:bg-foreground/[0.02] hover:border-cyan-500/50 
          transition-all group
        `}
      >
        <input 
          type="file" 
          className="hidden" 
          accept={accept} 
          onChange={(e) => handle(e.target.files?.[0])} 
        />
        
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Dynamic Icon: Shows upload normally, or a checkmark if file is selected */}
          {name ? (
            <FileCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          ) : (
            <Upload className="w-4 h-4 text-foreground/20 group-hover:text-cyan-400 transition-colors shrink-0" />
          )}
          
          <span className="text-sm text-foreground/60 group-hover:text-foreground/80 transition-colors truncate">
            {name || "Choose an image (JPG/PNG/WebP)"}
          </span>
        </div>

        {/* The "Browse" button now matches your UI style */}
        <span className="rounded-xl bg-foreground/[0.05] border border-border px-4 py-1.5 text-xs font-medium text-foreground hover:bg-foreground hover:text-background transition-all shrink-0">
          Browse
        </span>
      </label>
    </div>
  );
}