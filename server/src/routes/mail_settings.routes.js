import { Router } from "express";
import {
  createEmailSetting,
  getEmailSettings,
} from "../controllers/mail_settings.controller.js";

const router = Router();

router.route("/add").post(createEmailSetting);
router.route("/").get(getEmailSettings);

export default router;
