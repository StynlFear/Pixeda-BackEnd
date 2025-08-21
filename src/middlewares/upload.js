// upload/uploader.js
import multer from "multer";
import path from "path";
import fs from "fs";
import { promises as fsp } from "fs";

// ----  ROOT: Koyeb volume or local fallback  ----
export const UPLOADS_ROOT =
  process.env.UPLOADS_ROOT || path.resolve("uploads"); // dev fallback

// Ensure base dirs exist (both local/dev and Koyeb)
async function initDirs() {
  const subdirs = [
    ".",                 // UPLOADS_ROOT itself
    "orders",
    "orders/graphics",
    "orders/finished",
    "orders/attachments",
    "orders/general",
  ];
  await Promise.all(
    subdirs.map(d => fsp.mkdir(path.join(UPLOADS_ROOT, d), { recursive: true }))
  );
}
initDirs().catch(console.error);

// Sanitize filename (no weird chars)
const sanitize = (name) => name.replace(/[^\w.\-()+\s]/g, "_");

// Decide subdir by field name (works for both singular/plural + items[0][...])
const pickSubdir = (field) => {
  if (field.includes("graphicsImage")) return "graphics";
  if (field.includes("finishedProductImage")) return "finished";
  if (field.includes("attachments")) return "attachments";
  return "general";
};

// Multer storage that *creates* folders before writing
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(UPLOADS_ROOT, "orders", pickSubdir(file.fieldname));
    fsp.mkdir(dest, { recursive: true })
      .then(() => cb(null, dest))
      .catch(err => cb(err));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const base = sanitize(path.basename(file.originalname, ext));
    const orderId = req.params.id || req.body.orderId || "new";
    const itemIndex = file.fieldname.match(/\[(\d+)\]/)?.[1] || "0";
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${orderId}-item${itemIndex}-${base}-${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype?.startsWith("image/")) return cb(null, true);
  cb(new Error("Only image files are allowed!"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
    files: 20,
  },
});

// --- Exports ---

// For non-itemized payloads; supports both singular & plural names
export const uploadOrderImages = upload.fields([
  { name: "graphicsImage", maxCount: 10 },
  { name: "finishedProductImage", maxCount: 10 },
  { name: "graphicsImages", maxCount: 10 },
  { name: "finishedProductImages", maxCount: 10 },
  { name: "attachments", maxCount: 20 },
]);

// For itemized payloads: items[0][graphicsImage], etc.
export const uploadOrderItemImages = (req, res, next) => {
  // Try to detect how many items are coming
  let items = [];
  try {
    if (typeof req.body.items === "string") items = JSON.parse(req.body.items);
    else if (Array.isArray(req.body.items)) items = req.body.items;
  } catch (_) {}

  const fields = [];
  const count = items.length > 0 ? items.length : 10; // fallback for pre-sized forms
  for (let i = 0; i < count; i++) {
    fields.push(
      { name: `items[${i}][graphicsImage]`, maxCount: 1 },
      { name: `items[${i}][finishedProductImage]`, maxCount: 1 },
      { name: `items[${i}][attachments]`, maxCount: 5 },
    );
  }

  return upload.fields(fields)(req, res, next);
};

// Multer error handler
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE")
      return res.status(400).json({ error: "File too large. Maximum size is 20MB." });
    if (error.code === "LIMIT_FILE_COUNT")
      return res.status(400).json({ error: "Too many files uploaded." });
    if (error.code === "LIMIT_UNEXPECTED_FILE")
      return res.status(400).json({ error: "Unexpected file field." });
  }
  if (error?.message === "Only image files are allowed!")
    return res.status(400).json({ error: "Only image files are allowed." });

  next(error);
};

export default upload;
