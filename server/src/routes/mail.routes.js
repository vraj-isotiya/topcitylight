import { Router } from "express";
import {
  sendEmail,
  replyToEmail,
  getEmailThreads,
  getAllEmails,
} from "../controllers/mail.controller.js";

const router = Router();

router.route("/send").post(sendEmail);
router.route("/reply").post(replyToEmail);
router.route("/thread/:customer_id").get(getEmailThreads);
router.route("/all").get(getAllEmails);

export default router;
