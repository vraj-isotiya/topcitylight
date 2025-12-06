import { Router } from "express";
import { getDashboardReport } from "../controllers/report.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/stats").get(verifyJWT, getDashboardReport);

export default router;
