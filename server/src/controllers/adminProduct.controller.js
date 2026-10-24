import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Review } from "../models/Review.js";
import { AppError } from "../utils/AppError.js";
import { slugify } from "../utils/text.js";
import { buildProductFilter, paginate, sortFor } from "../services/catalog.js";
import { isStoredImage, removeImages, storeImages } from "../services/imageStorage.js";
import { invalidateCatalogCache } from "../services/chat/knowledge.js";

export async function adminListProducts(req, res) {
  const query = req.valid.query;
  const filter = await buildProductFilter(query, { includeInactive: true });

  const [items, total] = await Promise.all([
    Product.find(filter)
      .select("name slug price compareAtPrice images stock sizes isActive isFeatured category sku brand rating reviewCount updatedAt createdAt")
      .populate("category", "name slug")
      .sort(sortFor(query.sort))
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    Product.countDocuments(filter),
  ]);

  res.json({ items, pagination: paginate(query.page, query.limit, total) });
}

export async function adminGetProduct(req, res) {
  const product = await Product.findById(req.valid.params.id).populate("category", "name slug");
  if (!product) throw AppError.notFound("Product not found.");
  res.json({ product });
}

async function assertCategory(id) {
  if (!(await Category.exists({ _id: id }))) {
    throw AppError.badRequest("Choose a category that exists.", { details: { fields: { category: "Category not found." } } });
  }
}

// Images must have come from our own upload endpoint (or already belong to
// the product being edited); arbitrary third-party URLs are refused.
function assertImages(images, existing = []) {
  const known = new Set(existing.map((image) => image.publicId));
  const foreign = images.find((image) => !known.has(image.publicId) && !isStoredImage(image));
  if (foreign) {
    throw AppError.badRequest("Upload images through the dashboard; external image links are not accepted.", {
      code: "INVALID_IMAGE_SOURCE",
    });
  }
}

async function uniqueSlug(name, ignoreId) {
  const base = slugify(name) || "product";
  let slug = base;
  for (let n = 2; await Product.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) }); n += 1) {
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function createProduct(req, res) {
  const input = req.valid.body;
  await assertCategory(input.category);
  assertImages(input.images);

  const product = new Product({
    ...input,
    compareAtPrice: input.compareAtPrice ?? undefined,
    slug: await uniqueSlug(input.name),
  });
  await product.save();
  invalidateCatalogCache();
  await product.populate("category", "name slug");
  res.status(201).json({ product });
}

export async function updateProduct(req, res) {
  const product = await Product.findById(req.valid.params.id);
  if (!product) throw AppError.notFound("Product not found.");

  const input = req.valid.body;
  await assertCategory(input.category);
  assertImages(input.images, product.images);

  const keptIds = new Set(input.images.map((image) => image.publicId));
  const removedIds = product.images.map((image) => image.publicId).filter((id) => !keptIds.has(id));

  if (input.name !== product.name) product.slug = await uniqueSlug(input.name, product._id);
  product.set({ ...input, compareAtPrice: input.compareAtPrice ?? undefined });
  if (input.compareAtPrice == null) product.compareAtPrice = undefined;
  await product.save();
  invalidateCatalogCache();

  // Only clean up storage after the database write succeeded.
  await removeImages(removedIds);
  await product.populate("category", "name slug");
  res.json({ product });
}

export async function patchProduct(req, res) {
  const product = await Product.findByIdAndUpdate(req.valid.params.id, { $set: req.valid.body }, { new: true, runValidators: true });
  if (!product) throw AppError.notFound("Product not found.");
  invalidateCatalogCache();
  res.json({ product });
}

export async function deleteProduct(req, res) {
  const product = await Product.findById(req.valid.params.id);
  if (!product) throw AppError.notFound("Product not found.");

  await product.deleteOne();
  await Review.deleteMany({ product: product._id });
  invalidateCatalogCache();
  await removeImages(product.images.map((image) => image.publicId));
  res.status(204).end();
}

export async function uploadImages(req, res) {
  if (!req.files?.length) {
    throw AppError.badRequest('Choose at least one image to upload in the "images" field.', { code: "NO_FILES" });
  }
  const images = await storeImages(req.files);
  res.status(201).json({ images });
}
