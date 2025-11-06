import { Router } from "express";
import {
  addCustomerProduct,
  getProductsByCustomerId,
  deleteCustomerProduct,
} from "../controllers/customer_products.controller.js";

import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/add").post(verifyJWT, isAdmin, addCustomerProduct);
router.route("/:customer_id").get(verifyJWT, getProductsByCustomerId);
router
  .route("/:customer_id/:product_id")
  .delete(verifyJWT, isAdmin, deleteCustomerProduct);

export default router;
