import { Router } from "express";
import {
  createCustomerSource,
  getAllCustomerSources,
  getCustomerSourceById,
  updateCustomerSource,
  deleteCustomerSource,
} from "../controllers/customer_source.controller.js";

import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/add").post(verifyJWT, isAdmin, createCustomerSource);
router.route("/all").get(verifyJWT, getAllCustomerSources);
router.route("/:id").get(verifyJWT, getCustomerSourceById);
router.route("/:id").patch(verifyJWT, isAdmin, updateCustomerSource);
router.route("/:id").delete(verifyJWT, isAdmin, deleteCustomerSource);

export default router;
