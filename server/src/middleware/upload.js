// server/src/middleware/upload.js
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- ID CARD UPLOAD (existing) ----------------
const idStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "..", "uploads", "idcards"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const safeName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow common image types plus SVG for ID cards (SVG used by some uploads)
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  const ok = allowed.includes(file.mimetype);
  cb(ok ? null : new Error("Only JPG/PNG/WEBP/SVG allowed"), ok);
};

export const uploadIdCard = multer({
  storage: idStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ---------------- CHAT ATTACHMENT UPLOAD (NEW) ----------------
const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "..", "uploads", "chat"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const name = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${ext}`;
    cb(null, name);
  },
});

export const uploadChatAttachment = multer({
  storage: chatStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});
