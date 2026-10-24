import mongoose from "mongoose";
import { SIZE_LABEL } from "./Product.js";

export const MAX_QTY_PER_LINE = 10;
export const MAX_CART_LINES = 30;

// A cart stores only what the shopper chose. Prices, names and stock are
// looked up from Product every time the cart is read.
const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  size: { type: String, required: true, match: SIZE_LABEL },
  quantity: { type: Number, required: true, min: 1, max: MAX_QTY_PER_LINE },
});

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

export const Cart = mongoose.model("Cart", cartSchema);
