import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    // Empty for reviews imported with the seed catalogue.
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    authorName: { type: String, required: true, trim: true, maxlength: 80 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 80, default: "" },
    // Stored as plain text and always rendered as text, never as HTML.
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    // True when the author has an order containing this product.
    verified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// One review per customer per product.
reviewSchema.index({ product: 1, user: 1 }, { unique: true, partialFilterExpression: { user: { $exists: true } } });
reviewSchema.index({ createdAt: -1 });

export const Review = mongoose.model("Review", reviewSchema);
