import express from "express";
import {
  createUser,
  loginManager,
  generateTicket,
  getTicketQRCode,
  checkToken,
} from "../controller/manager.controller.js";

import { protectManager } from "../middlewares/managerAuth.js";

const router = express.Router();

router.post("/login", loginManager);
router.post("/create-user", protectManager, createUser);
router.post("/generate-user-ticket", protectManager, generateTicket);
router.get("/ticket/qrcode/:ticket_id", protectManager, getTicketQRCode);
router.get("/check-token", protectManager, checkToken);

export default router;
