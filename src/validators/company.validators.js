// validators/company.validators.js
import { body, param, query } from "express-validator";

export const idParamValidator = [
  param("id").isMongoId().withMessage("Invalid company id"),
];

export const createCompanyValidator = [
  body("name").trim().notEmpty().withMessage("Company name is required"),
  body("cui").optional({ checkFalsy: true }).isString().trim(),
  body("description").optional({ checkFalsy: true }).isString().trim(),
  body("defaultFolderPath").optional({ checkFalsy: true }).isString().trim(),
];

export const updateCompanyValidator = [
  body("name").optional({ checkFalsy: true }).isString().trim(),
  body("cui").optional({ checkFalsy: true }).isString().trim(),
  body("description").optional({ checkFalsy: true }).isString().trim(),
  body("defaultFolderPath").optional({ checkFalsy: true }).isString().trim(),
];

export const listCompaniesValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("sort").optional().isString(),        // e.g., "-createdAt" or "name"
  query("search").optional().isString().trim()
];
