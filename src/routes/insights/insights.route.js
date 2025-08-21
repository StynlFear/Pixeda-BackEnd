import { Router } from "express";
import {
  getOrderInsights,
  getEmployeeInsights,
  getClientInsights,
  getProductInsights,
  getFinancialInsights,
  getAuditInsights,
  getDashboardInsights
} from "../../controllers/insights/insights.controller.js";
import { handleValidation } from "../../middlewares/handleValidation.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { insightsQueryValidator } from "../../validators/insights.validators.js";

const router = Router();

// All insights routes require admin authentication
router.use(requireAuth);
router.use(requireRole("admin"));

// Dashboard overview - comprehensive insights for admin dashboard
router.get("/dashboard", insightsQueryValidator, handleValidation, getDashboardInsights);

// Specific insight categories
router.get("/orders", insightsQueryValidator, handleValidation, getOrderInsights);
router.get("/employees", insightsQueryValidator, handleValidation, getEmployeeInsights);
router.get("/clients", insightsQueryValidator, handleValidation, getClientInsights);
router.get("/products", insightsQueryValidator, handleValidation, getProductInsights);
router.get("/financial", insightsQueryValidator, handleValidation, getFinancialInsights);
router.get("/audit", insightsQueryValidator, handleValidation, getAuditInsights);

export default router;
