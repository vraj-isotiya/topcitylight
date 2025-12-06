import { Router } from "express";
import {
  sendEmail,
  replyToEmail,
  getEmailThreads,
  getAllEmails,
  getEmailStats,
  triggerEmailSync,
} from "../controllers/mail.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/send").post(verifyJWT, sendEmail);
router.route("/reply").post(verifyJWT, replyToEmail);
router.route("/stats").get(verifyJWT, getEmailStats);
router.route("/thread/:customer_id").get(verifyJWT, getEmailThreads);
router.route("/all").get(verifyJWT, getAllEmails);
router.route("/sync").post(verifyJWT, triggerEmailSync);

export default router;
