// frontend/src/components/CallModal.jsx
export default function CallModal({ incoming, name, onAccept, onReject }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-[#0F1A2A] p-6 rounded-xl text-center shadow-lg">
        <p className="text-xl font-semibold mb-3">
          {incoming ? `${name} is calling…` : `Calling ${name}…`}
        </p>

        {incoming ? (
          <div className="flex gap-4 justify-center mt-4">
            <button
              onClick={onAccept}
              className="px-4 py-2 bg-green-600 rounded"
            >
              Accept
            </button>
            <button
              onClick={onReject}
              className="px-4 py-2 bg-red-600 rounded"
            >
              Reject
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onReject}
              className="px-4 py-2 bg-red-600 rounded"
            >
              End Call
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
