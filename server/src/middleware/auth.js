  // Simple JWT auth middleware for ESM
  import jwt from "jsonwebtoken";

  export const auth = (req, res, next) => {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No token" });

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET); // { id, role, status }
      req.user = payload;
      next();
    } catch (_e) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
      