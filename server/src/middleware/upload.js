import multer from "multer";
import { AppError } from "../utils/AppError.js";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES_PER_REQUEST = 6;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// Files stay in memory: they are decoded and re-encoded by sharp before they
// ever reach storage, which is also where the real content check happens
// (the declared MIME type below is only a cheap first filter).
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: MAX_IMAGES_PER_REQUEST, fields: 5 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(AppError.badRequest(`"${file.originalname}" is not a supported image. Use JPG, PNG, WebP or AVIF.`, { code: "INVALID_FILE_TYPE" }));
    }
    cb(null, true);
  },
}).array("images", MAX_IMAGES_PER_REQUEST);
