// server/src/middleware/upload.js
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, "..", "..", "uploads");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

const idcardsDir = path.join(uploadsRoot, "idcards");
const chatDir = path.join(uploadsRoot, "chat");
const avatarsDir = path.join(uploadsRoot, "avatars");

ensureDir(idcardsDir);
ensureDir(chatDir);
ensureDir(avatarsDir);

// ---------------- ID CARD UPLOAD (existing) ----------------
const idStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, idcardsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const safeName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${ext}`;
    cb(null, safeName);
  },
});

const imageFileFilter = (req, file, cb) => {
  // Allow common image types plus SVG for ID cards (SVG used by some uploads)
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  const ok = allowed.includes(file.mimetype);
  cb(ok ? null : new Error("Only JPG/PNG/WEBP/SVG allowed"), ok);
};

export const uploadIdCard = multer({
  storage: idStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const safeName = `avatar-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, safeName);
  },
});

export const uploadProfileImage = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const registrationIdentityStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const target = file.fieldname === "idCard" ? idcardsDir : avatarsDir;
    cb(null, target);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const prefix = file.fieldname === "idCard" ? "id" : "avatar";
    cb(null, `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

export const uploadIdentityAssets = multer({
  storage: registrationIdentityStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ---------------- CHAT ATTACHMENT UPLOAD (NEW) ----------------
const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, chatDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const name = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${ext}`;
    cb(null, name);
  },
});

const chatFileFilter = (req, file, cb) => {
  const mime = String(file.mimetype || "").toLowerCase();
  const isImage = mime.startsWith("image/");
  const isAudioWebm = mime === "audio/webm";
  const isPdf = mime === "application/pdf";
  const ok = isImage || isAudioWebm || isPdf;
  cb(ok ? null : new Error("Only image/*, audio/webm, and PDF files are allowed"), ok);
};

export const uploadChatAttachment = multer({
  storage: chatStorage,
  fileFilter: chatFileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});
