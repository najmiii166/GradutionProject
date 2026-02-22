import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Video, X } from "lucide-react";
import UserAvatar from "./UserAvatar";

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const dataUrlToFile = async (dataUrl, fileName = "avatar.png") => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], fileName, { type: blob.type || "image/png" });
};

export default function UserAvatarPicker({
  label = "Profile Image",
  name = "",
  initialSrc = "",
  onChange,
  skipLabel,
  onSkip,
}) {
  const [preview, setPreview] = useState(initialSrc || "");
  const [isDragging, setIsDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    setPreview(initialSrc || "");
  }, [initialSrc]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const dataUrl = await toDataUrl(file);
    setPreview(dataUrl);
    onChange?.(file, dataUrl);
  };

  const openCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 0);
    } catch {
      setCameraError("Camera access was blocked. Please allow camera permission.");
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png", 0.95);
    const file = await dataUrlToFile(dataUrl, `avatar-${Date.now()}.png`);
    setPreview(dataUrl);
    onChange?.(file, dataUrl);
    setCameraOpen(false);
    stopCamera();
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 px-1">{label}</p>

      <div className="flex items-center gap-4">
        <UserAvatar name={name} src={preview} size={72} showInitials={false} className="shadow-sm" />
        <div className="flex-1 space-y-2">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              handleFile(file);
            }}
            className={`rounded-2xl border border-dashed px-4 py-3 transition-all ${isDragging ? "border-cyan-500/60 bg-cyan-500/5" : "border-border bg-foreground/[0.02]"}`}
          >
            <p className="text-xs text-foreground/60 mb-2">Drag & drop image here</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-foreground/[0.05] border border-border text-xs font-medium hover:bg-foreground/[0.08]"
              >
                <ImagePlus size={14} /> Upload
              </button>
              <button
                type="button"
                onClick={openCamera}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-foreground/[0.05] border border-border text-xs font-medium hover:bg-foreground/[0.08]"
              >
                <Camera size={14} /> Capture
              </button>
              {preview && (
                <button
                  type="button"
                  onClick={() => {
                    setPreview("");
                    onChange?.(null, "");
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-500 border border-rose-500/30 hover:bg-rose-500/10"
                >
                  <X size={14} /> Remove
                </button>
              )}
            </div>
          </div>
          {skipLabel && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="text-[11px] uppercase tracking-widest font-bold text-foreground/40 hover:text-cyan-500"
            >
              {skipLabel}
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {cameraError && <p className="text-xs text-rose-500">{cameraError}</p>}

      {cameraOpen && (
        <div className="rounded-2xl border border-border bg-background p-3 space-y-3">
          <div className="rounded-xl overflow-hidden border border-border bg-black/70">
            <video ref={videoRef} className="w-full h-52 object-cover" muted playsInline />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCameraOpen(false);
                stopCamera();
              }}
              className="px-3 py-2 rounded-xl border border-border text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={captureFrame}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold"
            >
              <Video size={14} /> Use Snapshot
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
