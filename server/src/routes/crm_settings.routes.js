import { Router } from "express";
import {
  getCrmSettings,
  updateCrmSettings,
} from "../controllers/crm_settings.controller.js";

import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").get(getCrmSettings);
router.route("/:id").patch(verifyJWT, isAdmin, updateCrmSettings);

export default router;
