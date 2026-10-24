import mongoose from "mongoose";

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
export const KIT_TYPES = ["home", "away", "third", "retro", "training", "special"];

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    // Identifier in the image host, used to delete the file when it is removed.
    publicId: { type: String, required: true },
    width: Number,
    height: Number,
    format: String,
    bytes: Number,
    alt: { type: String, trim: true, maxlength: 140, default: "" },
  },
  { _id: false },
);

const sizeSchema = new mongoose.Schema(
  {
    label: { type: String, enum: SIZES, required: true },
    stock: { type: Number, min: 0, default: 0, required: true },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    // Whole rupees. Prices are always read from here, never from the client.
    price: { type: Number, required: true, min: 0 },
    // Optional "was" price shown struck through when a product is on sale.
    compareAtPrice: { type: Number, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    team: { type: String, trim: true, maxlength: 80, default: "" },
    season: { type: String, trim: true, maxlength: 20, default: "" },
    kitType: { type: String, enum: KIT_TYPES, default: "home" },
    details: { type: [{ type: String, trim: true, maxlength: 160 }], default: [] },
    images: { type: [imageSchema], default: [] },
    sizes: { type: [sizeSchema], default: [] },
    // Sum of size stock, kept in sync on save so listings can filter and sort on it.
    stock: { type: Number, min: 0, default: 0, index: true },
    sku: { type: String, trim: true, uppercase: true, maxlength: 40 },
    isFeatured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    salesCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

productSchema.index({ isActive: 1, price: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, salesCount: -1 });

productSchema.virtual("onSale").get(function onSale() {
  return Boolean(this.compareAtPrice && this.compareAtPrice > this.price);
});

productSchema.pre("save", function syncStock() {
  this.stock = this.sizes.reduce((total, size) => total + size.stock, 0);
});

export const Product = mongoose.model("Product", productSchema);
