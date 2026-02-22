import { UserCircle2 } from "lucide-react";
import buildAvatarSrc from "../utils/buildAvatarSrc";

export default function UserAvatar({
  name = "",
  src = "",
  size = 40,
  className = "",
  showInitials = true,
}) {
  const initials = String(name || "")
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  const resolved = buildAvatarSrc(src);
  const styles = { width: size, height: size };

  if (resolved) {
    return (
      <img
        src={resolved}
        alt={name || "User"}
        style={styles}
        className={`rounded-full object-cover border border-border/80 bg-foreground/[0.03] ${className}`}
      />
    );
  }

  if (showInitials && initials) {
    return (
      <div
        style={styles}
        className={`rounded-full border border-border/80 bg-foreground/[0.04] text-foreground/70 flex items-center justify-center text-xs font-bold ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      style={styles}
      className={`rounded-full border border-border/80 bg-foreground/[0.03] text-foreground/35 flex items-center justify-center ${className}`}
    >
      <UserCircle2 size={Math.max(16, Math.floor(size * 0.55))} strokeWidth={1.8} />
    </div>
  );
}
