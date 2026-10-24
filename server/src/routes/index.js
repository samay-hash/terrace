import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { authLimiter, chatLimiter, uploadLimiter } from "../middleware/rateLimit.js";
import { imageUpload } from "../middleware/upload.js";
import * as s from "../validators/schemas.js";
import * as auth from "../controllers/auth.controller.js";
import * as products from "../controllers/product.controller.js";
import * as categories from "../controllers/category.controller.js";
import * as cart from "../controllers/cart.controller.js";
import * as orders from "../controllers/order.controller.js";
import * as adminProducts from "../controllers/adminProduct.controller.js";
import * as admin from "../controllers/admin.controller.js";
import { chat } from "../controllers/chat.controller.js";

export const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));

// ---------- Auth ----------
router.post("/auth/register", authLimiter, validate({ body: s.registerSchema }), auth.register);
router.post("/auth/login", authLimiter, validate({ body: s.loginSchema }), auth.login);
router.post("/auth/logout", auth.logout);
router.get("/auth/me", auth.me);

// ---------- Public catalogue ----------
router.get("/categories", categories.listCategories);
router.get("/products", validate({ query: s.productListQuery }), products.listProducts);
router.get("/products/facets", products.getFacets);
router.get("/products/:slug", validate({ params: s.slugParam }), products.getProduct);

// ---------- Cart ----------
router.post("/cart/quote", validate({ body: s.cartLinesSchema }), cart.quoteCart);
router.get("/cart", requireAuth, cart.getCart);
router.post("/cart/items", requireAuth, validate({ body: s.addCartItemSchema }), cart.addItem);
router.patch("/cart/items/:itemId", requireAuth, validate({ params: s.cartItemParam, body: s.updateCartItemSchema }), cart.updateItem);
router.delete("/cart/items/:itemId", requireAuth, validate({ params: s.cartItemParam }), cart.removeItem);
router.delete("/cart", requireAuth, cart.clearCart);
router.post("/cart/merge", requireAuth, validate({ body: s.cartLinesSchema }), cart.mergeCart);

// ---------- Orders ----------
router.post("/orders", requireAuth, validate({ body: s.checkoutSchema }), orders.placeOrder);
router.get("/orders", requireAuth, orders.listMyOrders);
router.get("/orders/:id", requireAuth, validate({ params: s.idParam }), orders.getOrder);

// ---------- Assistant ----------
router.post("/chat", chatLimiter, validate({ body: s.chatSchema }), chat);

// ---------- Admin (role enforced on the server for every route below) ----------
const adminRouter = Router();
adminRouter.use(requireRole("admin"));

adminRouter.get("/overview", admin.getOverview);

adminRouter.get("/products", validate({ query: s.adminProductListQuery }), adminProducts.adminListProducts);
adminRouter.post("/products", validate({ body: s.productInput }), adminProducts.createProduct);
adminRouter.get("/products/:id", validate({ params: s.idParam }), adminProducts.adminGetProduct);
adminRouter.put("/products/:id", validate({ params: s.idParam, body: s.productInput }), adminProducts.updateProduct);
adminRouter.patch("/products/:id", validate({ params: s.idParam, body: s.productPatch }), adminProducts.patchProduct);
adminRouter.delete("/products/:id", validate({ params: s.idParam }), adminProducts.deleteProduct);

adminRouter.post("/uploads", uploadLimiter, imageUpload, adminProducts.uploadImages);

adminRouter.get("/categories", categories.adminListCategories);
adminRouter.post("/categories", validate({ body: s.categoryInput }), categories.createCategory);
adminRouter.put("/categories/:id", validate({ params: s.idParam, body: s.categoryInput }), categories.updateCategory);
adminRouter.delete("/categories/:id", validate({ params: s.idParam }), categories.deleteCategory);

adminRouter.get("/orders", validate({ query: s.adminOrderListQuery }), orders.adminListOrders);
adminRouter.patch("/orders/:id/status", validate({ params: s.idParam, body: s.orderStatusSchema }), orders.updateOrderStatus);

router.use("/admin", adminRouter);
