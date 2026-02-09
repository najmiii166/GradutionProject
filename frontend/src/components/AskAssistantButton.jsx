import { useMemo } from "react";

export default function AskAssistantButton({ onOpen }) {
  const label = useMemo(() => "Ask Assistant", []);
  return (
    <button
      onClick={onOpen}
      className="fixed bottom-6 right-6 z-40 px-4 py-2 rounded-full bg-sky-600 hover:bg-sky-500 text-white shadow-lg border border-sky-400"
      aria-label={label}
    >
      {label}
    </button>
  );
}
