import mongoose from "mongoose";

export const GENDERS = ["men", "women", "unisex"];
// Size labels are free text so each category can use its own run:
// "XS"–"XXL" for clothing, "UK 7" for shoes, "One size" for accessories.
export const SIZE_LABEL = /^[A-Za-z0-9][A-Za-z0-9 ./-]{0,15}$/;

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
    label: { type: String, required: true, trim: true, match: SIZE_LABEL },
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
    brand: { type: String, trim: true, maxlength: 60, default: "", index: true },
    gender: { type: String, enum: GENDERS, default: "unisex", index: true },
    details: { type: [{ type: String, trim: true, maxlength: 160 }], default: [] },
    images: { type: [imageSchema], default: [] },
    // Kept in the order the admin entered them (that is the display order).
    sizes: { type: [sizeSchema], default: [] },
    // Sum of size stock, kept in sync on save so listings can filter and sort on it.
    stock: { type: Number, min: 0, default: 0, index: true },
    sku: { type: String, trim: true, uppercase: true, maxlength: 40 },
    isFeatured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    salesCount: { type: Number, default: 0, min: 0 },
    // Denormalised from reviews so listings can show and sort by rating.
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
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
productSchema.index({ isActive: 1, rating: -1 });

productSchema.virtual("onSale").get(function onSale() {
  return Boolean(this.compareAtPrice && this.compareAtPrice > this.price);
});

productSchema.pre("save", function syncStock() {
  this.stock = this.sizes.reduce((total, size) => total + size.stock, 0);
});

export const Product = mongoose.model("Product", productSchema);
