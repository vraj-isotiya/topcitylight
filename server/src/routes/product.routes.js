import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/add").post(verifyJWT, isAdmin, createProduct);
router.route("/all").get(verifyJWT, getAllProducts);
router.route("/:id").get(verifyJWT, getProductById);
router.route("/:id").patch(verifyJWT, isAdmin, updateProduct);
router.route("/:id").delete(verifyJWT, isAdmin, deleteProduct);

export default router;
