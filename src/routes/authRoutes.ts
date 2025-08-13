// src/routes/authRoutes.ts
import { Router } from "express";
import { AuthController } from "../controllers/authController";

const router = Router();
const controller = new AuthController();

router.get("/auth/google", controller.beginOAuth);
router.get("/auth/google/callback", controller.handleOAuthCallback);
router.get("/auth/google/status", controller.status);
router.post("/auth/google/revoke", controller.revoke);

export default router;
