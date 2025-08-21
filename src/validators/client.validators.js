// validators/client.validators.js
import { body, param, query } from "express-validator";

export const idParamValidator = [
  param("id").isMongoId().withMessage("Invalid client id"),
];

export const createClientValidator = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("email")
    .optional({ checkFalsy: true })
    .isEmail().withMessage("Invalid email")
    .normalizeEmail(),
  body("phone").optional({ checkFalsy: true }).isString().trim(),
  body("whatsapp").optional({ checkFalsy: true }).isString().trim(),
  body("companies")
    .optional()
    .isArray().withMessage("Companies must be an array"),
  body("companies.*").optional({ checkFalsy: true }).isMongoId().withMessage("Invalid company ID"),
  body("defaultFolderPath").optional({ checkFalsy: true }).isString().trim(),
];

export const updateClientValidator = [
  body("firstName").optional({ checkFalsy: true }).isString().trim(),
  body("lastName").optional({ checkFalsy: true }).isString().trim(),
  body("email")
    .optional({ checkFalsy: true })
    .isEmail().withMessage("Invalid email")
    .normalizeEmail(),
  body("phone").optional({ checkFalsy: true }).isString().trim(),
  body("whatsapp").optional({ checkFalsy: true }).isString().trim(),
  body("companies")
    .optional()
    .isArray().withMessage("Companies must be an array"),
  body("companies.*").optional({ checkFalsy: true }).isMongoId().withMessage("Invalid company ID"),
  body("defaultFolderPath").optional({ checkFalsy: true }).isString().trim(),
];

export const listClientsValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("sort").optional().isString(),        // e.g., "-createdAt" or "lastName"
  query("search").optional().isString().trim()
];
