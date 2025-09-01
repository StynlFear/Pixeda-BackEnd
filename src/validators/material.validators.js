import { body, param } from "express-validator";

export const createMaterialRules = [
  body("name").isString().trim().notEmpty().withMessage("name is required")
];

export const idParamRule = [param("id").isMongoId()];
