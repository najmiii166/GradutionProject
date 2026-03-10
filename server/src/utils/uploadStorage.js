import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadsRoot = path.join(__dirname, "..", "..", "uploads");
const PUBLIC_PREFIX = "/uploads/";
const SAFE_CATEGORIES = new Set(["avatars", "idcards", "chat"]);

const MIME_EXTENSION_MAP = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "audio/webm": ".webm",
  "application/pdf": ".pdf",
};

export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function ensureUploadCategoryDir(category) {
  if (!SAFE_CATEGORIES.has(category)) {
    throw new Error(`Unsupported upload category: ${category}`);
  }

  const dirPath = path.join(uploadsRoot, category);
  ensureDir(dirPath);
  return dirPath;
}

function sanitizeExtension(extension) {
  const normalized = String(extension || "")
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");

  if (!normalized.startsWith(".")) return "";
  if (normalized.length > 12) return "";
  return normalized;
}

function resolveExtension(originalname, mimetype) {
  const originalExt = sanitizeExtension(path.extname(originalname || ""));
  if (originalExt) return originalExt;
  return MIME_EXTENSION_MAP[String(mimetype || "").toLowerCase()] || "";
}

export function createHashedUploadMeta(category, { originalname, mimetype } = {}) {
  ensureUploadCategoryDir(category);

  const extension = resolveExtension(originalname, mimetype);
  const digest = crypto
    .createHash("sha256")
    .update(crypto.randomBytes(32))
    .update(String(Date.now()))
    .update(String(originalname || ""))
    .digest("hex");

  const levelOne = digest.slice(0, 2);
  const levelTwo = digest.slice(2, 4);
  const fileName = `${digest}${extension}`;
  const absoluteDir = path.join(uploadsRoot, category, levelOne, levelTwo);
  const absolutePath = path.join(absoluteDir, fileName);
  const relativePath = path.posix.join(category, levelOne, levelTwo, fileName);

  ensureDir(absoluteDir);

  return {
    category,
    digest,
    extension,
    fileName,
    absoluteDir,
    absolutePath,
    relativePath,
    publicUrl: buildUploadPublicUrl(relativePath),
  };
}

export function buildUploadPublicUrl(relativePath) {
  const normalized = String(relativePath || "").replace(/\\+/g, "/").replace(/^\/+/, "");
  return `${PUBLIC_PREFIX}${normalized}`;
}

export function getRelativeUploadPath(uploadUrl) {
  const normalized = String(uploadUrl || "").trim().replace(/\\+/g, "/");
  if (!normalized.startsWith(PUBLIC_PREFIX)) {
    throw new Error("Upload URL must start with /uploads/");
  }

  const relativePath = path.posix.normalize(normalized.slice(PUBLIC_PREFIX.length));
  if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Invalid upload path");
  }

  const category = relativePath.split("/")[0];
  if (!SAFE_CATEGORIES.has(category)) {
    throw new Error("Unsupported upload category");
  }

  return relativePath;
}

export function resolveUploadAbsolutePath(uploadUrl) {
  const relativePath = getRelativeUploadPath(uploadUrl);
  const absolutePath = path.resolve(uploadsRoot, relativePath);
  const resolvedRoot = path.resolve(uploadsRoot) + path.sep;

  if (!absolutePath.startsWith(resolvedRoot) && absolutePath !== path.resolve(uploadsRoot)) {
    throw new Error("Resolved upload path escapes uploads root");
  }

  return {
    relativePath,
    absolutePath,
    category: relativePath.split("/")[0],
  };
}

export function deleteUploadByUrl(uploadUrl) {
  if (!uploadUrl) return false;

  try {
    const { absolutePath } = resolveUploadAbsolutePath(uploadUrl);
    if (!fs.existsSync(absolutePath)) return false;
    fs.unlinkSync(absolutePath);
    return true;
  } catch {
    return false;
  }
}
