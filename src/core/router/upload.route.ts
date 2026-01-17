import { Router } from "express";
import { UploadController } from "../controller/upload.controller";
import multer from "multer";
import { ExportController } from "../controller/export.controller";

const upload = multer({ dest: "uploads/" });

const router = Router();
const uploadController = new UploadController();
const exportController = new ExportController();

router.post("/import", upload.single("file"), uploadController.uploadFile);
router.get("/exports", upload.single("file"), exportController.exportData);

export default router;
