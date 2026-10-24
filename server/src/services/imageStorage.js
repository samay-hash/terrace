import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const LOCAL_UPLOAD_DIR = path.resolve(here, "../../uploads");
const MAX_DIMENSION = 2000;
const MIN_DIMENSION = 300;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "heif"]);

if (config.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Decode the bytes with sharp to prove they really are an image (a renamed
// .exe or an SVG with a script tag fails here), then re-encode to WebP. The
// re-encode also strips EXIF metadata such as GPS coordinates.
export async function normalizeImage(buffer, originalName = "image") {
  let metadata;
  try {
    metadata = await sharp(buffer, { failOn: "error" }).metadata();
  } catch {
    throw AppError.badRequest(`"${originalName}" could not be read as an image.`, { code: "INVALID_IMAGE" });
  }

  if (!ACCEPTED_FORMATS.has(metadata.format)) {
    throw AppError.badRequest(`"${originalName}" is not a supported image format.`, { code: "INVALID_FILE_TYPE" });
  }
  if ((metadata.width ?? 0) < MIN_DIMENSION || (metadata.height ?? 0) < MIN_DIMENSION) {
    throw AppError.badRequest(`"${originalName}" is too small. Use at least ${MIN_DIMENSION}×${MIN_DIMENSION} pixels.`, {
      code: "IMAGE_TOO_SMALL",
    });
  }

  const { data, info } = await sharp(buffer)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86 })
    .toBuffer({ resolveWithObject: true });

  return { buffer: data, width: info.width, height: info.height, format: "webp", bytes: info.size };
}

const cloudinaryDriver = {
  name: "cloudinary",
  async save(image) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: config.CLOUDINARY_FOLDER, resource_type: "image", overwrite: false },
        (error, uploaded) => (error ? reject(error) : resolve(uploaded)),
      );
      stream.end(image.buffer);
    }).catch((error) => {
      console.error("Cloudinary upload failed:", error?.message);
      throw new AppError(502, "The image host rejected the upload. Please try again.", { code: "UPLOAD_FAILED" });
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  },
  async remove(publicId) {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  },
  owns(image) {
    return (
      image.url.startsWith(`https://res.cloudinary.com/${config.CLOUDINARY_CLOUD_NAME}/`) &&
      image.publicId.startsWith(config.CLOUDINARY_FOLDER)
    );
  },
};

// Development fallback so the project runs without a Cloudinary account.
// It is refused in production; see config/env.js and the README.
const localDriver = {
  name: "local",
  async save(image) {
    await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
    const id = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}`;
    const fileName = `${id}.webp`;
    await fs.writeFile(path.join(LOCAL_UPLOAD_DIR, fileName), image.buffer);
    return {
      url: `/uploads/${fileName}`,
      publicId: `local/${id}`,
      width: image.width,
      height: image.height,
      format: image.format,
      bytes: image.bytes,
    };
  },
  async remove(publicId) {
    const id = publicId.replace(/^local\//, "");
    if (!/^[a-z0-9-]+$/.test(id)) return; // never touch paths outside the folder
    await fs.rm(path.join(LOCAL_UPLOAD_DIR, `${id}.webp`), { force: true });
  },
  owns(image) {
    return image.publicId.startsWith("local/") && /^\/uploads\/[a-z0-9-]+\.webp$/.test(image.url);
  },
};

export function getStorage() {
  if (config.cloudinaryEnabled) return cloudinaryDriver;
  if (config.isProduction) {
    throw new AppError(503, "Image uploads are not configured on this server.", { code: "UPLOADS_DISABLED" });
  }
  return localDriver;
}

export async function storeImages(files) {
  const storage = getStorage();
  // Validate every file before uploading any, so a bad file in a batch does
  // not leave half the batch orphaned in storage.
  const normalized = [];
  for (const file of files) {
    normalized.push(await normalizeImage(file.buffer, file.originalname));
  }
  const saved = [];
  for (const image of normalized) {
    saved.push(await storage.save(image));
  }
  return saved;
}

export async function removeImages(publicIds) {
  if (!publicIds.length) return;
  const storage = getStorage();
  const results = await Promise.allSettled(publicIds.map((id) => storage.remove(id)));
  for (const result of results) {
    if (result.status === "rejected") console.warn("Image cleanup failed:", result.reason?.message);
  }
}

export function isStoredImage(image) {
  if (config.cloudinaryEnabled) return cloudinaryDriver.owns(image);
  return localDriver.owns(image);
}
