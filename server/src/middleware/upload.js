// server/src/middleware/upload.js
import multer from "multer";
import path from "path";
import {
  createHashedUploadMeta,
  ensureUploadCategoryDir,
} from "../utils/uploadStorage.js";

ensureUploadCategoryDir("idcards");
ensureUploadCategoryDir("chat");
ensureUploadCategoryDir("avatars");

function createStorage(category) {
  return multer.diskStorage({
    destination: (_req, file, cb) => {
      const meta = createHashedUploadMeta(category, {
        originalname: file.originalname,
        mimetype: file.mimetype,
      });
      file.storedRelativePath = meta.relativePath;
      file.storedAbsolutePath = meta.absolutePath;
      file.storedPublicUrl = meta.publicUrl;
      file.storedFileName = meta.fileName;
      cb(null, meta.absoluteDir);
    },
    filename: (_req, file, cb) => {
      cb(null, file.storedFileName || createHashedUploadMeta(category, file).fileName);
    },
  });
}

function createMimeFilter(allowedMimeTypes, errorMessage) {
  return (_req, file, cb) => {
    const mime = String(file.mimetype || "").toLowerCase();
    const ok = allowedMimeTypes.includes(mime);
    cb(ok ? null : new Error(errorMessage), ok);
  };
}

const safeImageFileFilter = createMimeFilter(
  ["image/jpeg", "image/png", "image/webp"],
  "Only JPG, PNG, and WEBP files are allowed"
);

const REGISTRATION_IMAGE_MAX_SIZE = 10 * 1024 * 1024;

// ---------------- ID CARD UPLOAD (existing) ----------------
const idStorage = createStorage("idcards");

export const uploadIdCard = multer({
  storage: idStorage,
  fileFilter: safeImageFileFilter,
  limits: { fileSize: REGISTRATION_IMAGE_MAX_SIZE },
});

const avatarStorage = createStorage("avatars");

export const uploadProfileImage = multer({
  storage: avatarStorage,
  fileFilter: safeImageFileFilter,
  limits: { fileSize: REGISTRATION_IMAGE_MAX_SIZE },
});

const registrationIdentityStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const category = file.fieldname === "idCard" ? "idcards" : "avatars";
    const meta = createHashedUploadMeta(category, {
      originalname: file.originalname,
      mimetype: file.mimetype,
    });
    file.storedRelativePath = meta.relativePath;
    file.storedAbsolutePath = meta.absolutePath;
    file.storedPublicUrl = meta.publicUrl;
    file.storedFileName = meta.fileName;
    cb(null, meta.absoluteDir);
  },
  filename: (_req, file, cb) => {
    cb(null, file.storedFileName);
  },
});

export const uploadIdentityAssets = multer({
  storage: registrationIdentityStorage,
  fileFilter: safeImageFileFilter,
  limits: { fileSize: REGISTRATION_IMAGE_MAX_SIZE },
});

// ---------------- CHAT ATTACHMENT UPLOAD (NEW) ----------------
const chatStorage = createStorage("chat");

const allowedChatMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/webm",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.rar",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
]);

const allowedChatExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".webm",
  ".pdf",
  ".txt",
  ".csv",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
  ".rar",
  ".7z",
]);

const chatFileFilter = (req, file, cb) => {
  const mime = String(file.mimetype || "").toLowerCase();
  const ext = path.extname(String(file.originalname || "")).toLowerCase();
  const ok = allowedChatMimeTypes.has(mime) || allowedChatExtensions.has(ext);
  cb(
    ok
      ? null
      : new Error("Only images, audio/webm, PDF, text, Office, and archive files are allowed"),
    ok
  );
};

export const uploadChatAttachment = multer({
  storage: chatStorage,
  fileFilter: chatFileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});
