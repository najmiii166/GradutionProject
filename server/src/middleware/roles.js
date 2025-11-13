export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
  next();
};

export const requireVerified = (req, res, next) => {
  if (req.user?.role === "admin") return next(); // admins bypass
  if (req.user?.status !== "verified") {
    return res.status(403).json({ message: "Account not verified by admin yet" });
  }
  next();
};
