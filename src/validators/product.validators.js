import { body, param, query } from "express-validator";

export const createProductRules = [
  body("productName").isString().trim().notEmpty().withMessage("productName is required"),
  body("productCode").optional().isString().trim(),
  body("type").optional().isString().trim(),
  body("description").optional().isString().trim(),
  body("materials").optional().isArray().withMessage("materials must be an array"),
  body("materials.*").optional().isMongoId().withMessage("each material must be a valid id"),
  body("price").optional().isFloat({ min: 0 }).withMessage("price must be >= 0"),
];

export const updateProductRules = [
  body("productName").optional().isString().trim().notEmpty(),
  body("productCode").optional().isString().trim(),
  body("type").optional().isString().trim(),
  body("description").optional().isString().trim(),
  body("materials").optional().isArray().withMessage("materials must be an array"),
  body("materials.*").optional().isMongoId().withMessage("each material must be a valid id"),
  body("price").optional().isFloat({ min: 0 }).withMessage("price must be >= 0"),
];

export const listQueryRules = [
  query("q").optional().isString().trim(),
  query("type").optional().isString().trim(),
  query("materials").optional().isString().trim(), // comma-separated ids
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("sortBy").optional().isString().trim(), // productName | productCode | price | createdAt
  query("order").optional().isIn(["asc", "desc"]).trim(),
];

export const idParamRule = [param("id").isMongoId()];
