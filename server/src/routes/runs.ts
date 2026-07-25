import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createRun,
  getRuns,
  getRunById,
  getReport,
  exportPdf,
  exportMarkdown,
  exportJson,
} from "../controllers/runController";

const router = Router();

router.use(authMiddleware);

router.post("/", createRun);
router.get("/", getRuns);
router.get("/:id", getRunById);
router.get("/:id/report", getReport);
router.get("/:id/export/pdf", exportPdf);
router.get("/:id/export/markdown", exportMarkdown);
router.get("/:id/export/json", exportJson);

export { router as runRoutes };
