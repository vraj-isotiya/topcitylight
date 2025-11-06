import { Router } from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customers.controller.js";

const router = Router();

import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";

router.route("/add").post(verifyJWT, isAdmin, createCustomer);
router.route("/all").get(verifyJWT, getAllCustomers);
router.route("/:id").get(verifyJWT, getCustomerById);
router.route("/:id").patch(verifyJWT, isAdmin, updateCustomer);
router.route("/:id").delete(verifyJWT, isAdmin, deleteCustomer);

export default router;
