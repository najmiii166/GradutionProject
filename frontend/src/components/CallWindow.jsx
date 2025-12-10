// frontend/src/components/CallWindow.jsx
export default function CallWindow({ visible, localVideoRef, remoteVideoRef, onEnd }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center p-4">
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-2/3 rounded-lg shadow-xl mb-4"
      />

      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="w-40 bottom-6 right-6 fixed rounded-lg shadow-lg"
      />

      <button
        onClick={onEnd}
        className="px-5 py-3 bg-red-600 rounded-full mt-6"
      >
        End Call
      </button>
    </div>
  );
}
