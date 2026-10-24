import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { slugify } from "../utils/text.js";

// Categories with the number of live products in each (used by navigation,
// the home page and the shop filters). Admin gets every product counted.
async function categoriesWithCounts({ includeInactive }) {
  const match = includeInactive ? {} : { isActive: true };
  const [categories, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1, name: 1 }),
    Product.aggregate([{ $match: match }, { $group: { _id: "$category", count: { $sum: 1 } } }]),
  ]);
  const countById = new Map(counts.map((c) => [String(c._id), c.count]));
  return categories.map((category) => ({ ...category.toJSON(), productCount: countById.get(category.id) ?? 0 }));
}

export async function listCategories(_req, res) {
  res.json({ items: await categoriesWithCounts({ includeInactive: false }) });
}

export async function adminListCategories(_req, res) {
  res.json({ items: await categoriesWithCounts({ includeInactive: true }) });
}

export async function createCategory(req, res) {
  const { name, description = "", sortOrder } = req.valid.body;
  const slug = slugify(name);
  if (!slug) throw AppError.badRequest("Use letters or numbers in the category name.");
  if (await Category.exists({ slug })) throw AppError.conflict("A category with this name already exists.");

  const category = await Category.create({ name, slug, description, sortOrder });
  res.status(201).json({ category });
}

export async function updateCategory(req, res) {
  const category = await Category.findById(req.valid.params.id);
  if (!category) throw AppError.notFound("Category not found.");

  const { name, description = "", sortOrder } = req.valid.body;
  const slug = slugify(name);
  if (slug !== category.slug && (await Category.exists({ slug }))) {
    throw AppError.conflict("A category with this name already exists.");
  }

  Object.assign(category, { name, slug, description, sortOrder });
  await category.save();
  res.json({ category });
}

export async function deleteCategory(req, res) {
  const category = await Category.findById(req.valid.params.id);
  if (!category) throw AppError.notFound("Category not found.");

  const inUse = await Product.countDocuments({ category: category._id });
  if (inUse > 0) {
    throw AppError.conflict(
      `This category still has ${inUse} product${inUse === 1 ? "" : "s"}. Move or delete them first.`,
      { code: "CATEGORY_IN_USE" },
    );
  }

  await category.deleteOne();
  res.status(204).end();
}
