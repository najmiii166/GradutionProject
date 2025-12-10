// frontend/src/components/CallWindow.jsx

export default function CallWindow({
  visible,
  remoteAudioRef,
  duration,
  onEnd
}) {
  if (!visible) return null;

  const safeDuration = duration ?? 0; // prevent crash

  const timeString = new Date(safeDuration * 1000)
    .toISOString()
    .substring(14, 19);

  return (
    <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
      <div className="bg-[#0F1A2A] p-6 rounded-xl shadow-xl border border-[#1E2A3A] text-center">

        <p className="text-xl font-semibold mb-2">In Call</p>

        {/* Timer */}
        <p className="text-3xl font-mono mb-6">{timeString}</p>

        {/* Remote Audio Stream */}
        <audio ref={remoteAudioRef} autoPlay />

        <button
          onClick={onEnd}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full shadow-lg mt-6"
        >
          End Call
        </button>
      </div>
    </div>
  );
}
