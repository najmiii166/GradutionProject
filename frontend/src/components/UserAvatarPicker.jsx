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
  const [cameraLoading, setCameraLoading] = useState(false);
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

    if (videoRef.current) {
      videoRef.current.pause?.();
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play().catch(() => {});
  }, [cameraOpen]);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const dataUrl = await toDataUrl(file);
    setPreview(dataUrl);
    onChange?.(file, dataUrl);
  };

  const closeCameraModal = () => {
    setCameraOpen(false);
    setCameraLoading(false);
    stopCamera();
  };

  const openCamera = async () => {
    setCameraError("");
    setCameraLoading(true);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraLoading(false);
      setCameraError("This device or browser does not support camera capture.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setCameraLoading(false);
    } catch {
      stopCamera();
      setCameraLoading(false);
      setCameraError("Camera access was blocked. Please allow camera permission.");
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError("Camera preview is not ready yet. Please wait a moment and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCameraError("Failed to capture the image. Please try again.");
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png", 0.95);
    const file = await dataUrlToFile(dataUrl, `avatar-${Date.now()}.png`);
    setPreview(dataUrl);
    onChange?.(file, dataUrl);
    closeCameraModal();
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
                disabled={cameraLoading}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-foreground/[0.05] border border-border text-xs font-medium hover:bg-foreground/[0.08]"
              >
                <Camera size={14} /> {cameraLoading ? "Opening..." : "Capture"}
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
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-background/70 p-4 backdrop-blur-md">
          <div
            className="absolute inset-0"
            onClick={closeCameraModal}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-2xl rounded-[2rem] border border-border/50 bg-card/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-500">Camera Capture</p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">Preview your avatar before saving</h3>
                <p className="mt-1 text-sm text-foreground/45">Center your face in the frame, then capture the photo.</p>
              </div>
              <button
                type="button"
                onClick={closeCameraModal}
                className="rounded-2xl border border-border/60 bg-background/70 p-2 text-foreground/55 transition-all hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-border/50 bg-black">
              <video ref={videoRef} className="h-[320px] w-full object-cover sm:h-[420px]" muted playsInline autoPlay />
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-foreground/45">
                The captured image will be used as your avatar.
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="rounded-2xl border border-border/60 px-4 py-2.5 text-xs font-semibold text-foreground/65 transition-all hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={captureFrame}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-cyan-400"
                >
                  <Video size={14} /> Capture Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
