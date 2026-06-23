import express from "express";
import {
  createUser,
  loginManager,
  generateTicket,
  getTicketQRCode,
  checkToken,
  verifyTicket,
  confirmAndConsumeTicket,
} from "../controller/manager.controller.js";

import { protectManager } from "../middlewares/managerAuth.js";

const router = express.Router();

router.get("/check-token", protectManager, checkToken);
router.post("/login", loginManager);
router.post("/create-user", protectManager, createUser);
router.post("/generate-user-ticket", protectManager, generateTicket);
router.get("/ticket/qrcode/:ticket_id", protectManager, getTicketQRCode);
router.post('/verify-ticket', protectManager, verifyTicket);
router.post('/confirm-entry', protectManager, confirmAndConsumeTicket);

export default router;
