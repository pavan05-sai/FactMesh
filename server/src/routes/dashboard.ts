import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getDashboardStats } from "../controllers/dashboardController";

const router = Router();

router.use(authMiddleware);

router.get("/stats", getDashboardStats);

export { router as dashboardRoutes };
