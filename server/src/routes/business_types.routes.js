import { Router } from "express";
import {
  createBusinessType,
  getAllBusinessTypes,
  getBusinessTypeById,
  updateBusinessType,
  deleteBusinessType,
} from "../controllers/business_types.controller.js";

const router = Router();

import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";

router.route("/add").post(verifyJWT, isAdmin, createBusinessType);
router.route("/all").get(verifyJWT, getAllBusinessTypes);
router.route("/:id").get(verifyJWT, getBusinessTypeById);
router.route("/:id").patch(verifyJWT, isAdmin, updateBusinessType);
router.route("/:id").delete(verifyJWT, isAdmin, deleteBusinessType);

export default router;
