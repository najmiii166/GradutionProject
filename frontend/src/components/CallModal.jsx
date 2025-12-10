// frontend/src/components/CallModal.jsx

export default function CallModal({
  incoming,
  name,
  status,
  onAccept,
  onReject
}) {
  // status can be: "calling", "ringing", "connected"

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#0F1A2A] p-6 rounded-xl text-center shadow-xl border border-[#1E2A3A]">

        {/* TITLE */}
        <p className="text-xl font-semibold mb-3">
          {incoming
            ? `${name} is calling…`
            : status === "ringing"
            ? `Ringing ${name}…`
            : `Calling ${name}…`}
        </p>

        {/* BUTTONS */}
        {incoming ? (
          <div className="flex gap-4 justify-center mt-4">
            <button
              onClick={onAccept}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-lg shadow"
            >
              Accept
            </button>

            <button
              onClick={onReject}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg shadow"
            >
              Reject
            </button>
          </div>
        ) : (
          <button
            onClick={onReject}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg shadow mt-4"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
