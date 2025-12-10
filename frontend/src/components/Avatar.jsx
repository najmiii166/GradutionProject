// frontend/src/components/Avatar.jsx
export default function Avatar({ name = "", src = "", size = 36 }) {
  const initials = name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

  const styles = {
    width: size,
    height: size,
  };

  return src ? (
    <img
      src={src}
      alt={name}
      style={styles}
      className="rounded-full object-cover border border-slate-700"
    />
  ) : (
    <div
      style={styles}
      className="rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-semibold border border-slate-600"
    >
      {initials || "?"}
    </div>
  );
}
