import { Router } from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user_management.controller.js";

import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/add").post(verifyJWT, isAdmin, createUser);
router.route("/all").get(verifyJWT, isAdmin, getAllUsers);
router.route("/:id").get(verifyJWT, isAdmin, getUserById);
router.route("/:id").patch(verifyJWT, isAdmin, updateUser);
router.route("/:id").delete(verifyJWT, isAdmin, deleteUser);

export default router;
