import { Router } from "express";
import { UploadController } from "../controller/upload.controller";
import multer from "multer";
import { ExportController } from "../controller/export.controller";
import { upload, uploadImage } from "../../middleware/upload";


const router = Router();
const uploadController = new UploadController();
const exportController = new ExportController();

router.post("/import", upload.single("file"), uploadController.uploadFile);
router.post("/exports", upload.single("file"), exportController.exportData);
router.post("/images", uploadImage.single("file"), uploadController.uploadImage);

export default router;
