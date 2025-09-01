import { Router } from "express";
import { createMaterial, deleteMaterial, listMaterials } from "../../controllers/material/material.controller.js";
import { handleValidation } from "../../middlewares/handleValidation.js";
import { createMaterialRules, idParamRule } from "../../validators/material.validators.js";


const router = Router();

router.get("/", listMaterials);
router.post("/", createMaterialRules, handleValidation, createMaterial);
router.delete("/:id", idParamRule, handleValidation, deleteMaterial);

export default router;
