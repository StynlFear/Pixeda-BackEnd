import { Router } from "express";
import {
  createCompany,
  listCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
} from "../../controllers/company/company.controller.js";
import { handleValidation } from "../../middlewares/handleValidation.js";
import {
  createCompanyValidator,
  updateCompanyValidator,
  idParamValidator,
  listCompaniesValidator,
} from "../../validators/company.validators.js";

const router = Router();

router.post("/", createCompanyValidator, handleValidation, createCompany);
router.get("/", listCompaniesValidator, handleValidation, listCompanies);
router.get("/:id", idParamValidator, handleValidation, getCompany);
router.put("/:id", idParamValidator, updateCompanyValidator, handleValidation, updateCompany);
router.delete("/:id", idParamValidator, handleValidation, deleteCompany);

export default router;
