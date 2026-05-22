import { Router } from "express";
import { AuthController } from "../controller/auth.controller";
import { validateBody } from "../../middleware/requestValidator";
import { authLoginRequestSchema, authRegisterRequestSchema } from "../dto";

const router = Router();
const controller = new AuthController();

router.post("/signup", validateBody(authRegisterRequestSchema), controller.registerUser);
router.post("/admin/signin", validateBody(authLoginRequestSchema), controller.adminLogin);
router.post("/signin", validateBody(authLoginRequestSchema), controller.login);
router.get("/validate-token", controller.validateToken) 

export default router;
