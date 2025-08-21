import { Router } from "express";
import { login, refresh, logout, me } from "../../controllers/auth/auth.controller.js";
import { loginValidator } from "../../validators/auth.validators.js";
import { handleValidation } from "../../middlewares/handleValidation.js";
import { requireAuth } from "../../middlewares/auth.js";
import { loginLimiter } from "../../middlewares/security.js";

const router = Router();

router.post("/login", loginLimiter, loginValidator, handleValidation, login);
router.post("/refresh", refresh); // foloseste cookie httpOnly "rt"
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
