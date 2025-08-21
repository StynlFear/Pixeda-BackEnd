import { body, param, query } from "express-validator";

export const idParamValidator = [
  param("id").isMongoId().withMessage("Invalid employee id")
];

export const listEmployeesValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("sortBy").optional().isIn(["firstName","lastName","email","createdAt","updatedAt"]),
  query("order").optional().isIn(["asc","desc"]),
  query("q").optional().isString().trim(),
];

export const createEmployeeValidator = [
  body("firstName").isString().trim().isLength({ min: 2 }),
  body("lastName").isString().trim().isLength({ min: 2 }),
  body("email").isEmail().normalizeEmail(),
  body("phone").optional().isString().trim(),
  body("position").isIn(["employee","admin"]),
  body("password").isString().isLength({ min: 6 }),
  body("hireDate").optional().isISO8601().toDate(),
];

export const updateEmployeeValidator = [
  body("firstName").optional().isString().trim().isLength({ min: 2 }),
  body("lastName").optional().isString().trim().isLength({ min: 2 }),
  body("email").optional().isEmail().normalizeEmail(),
  body("phone").optional().isString().trim(),
  body("position").optional().isIn(["employee","admin"]),
  body("password").optional().isString().isLength({ min: 6 }),
  body("hireDate").optional().isISO8601().toDate(),
];
