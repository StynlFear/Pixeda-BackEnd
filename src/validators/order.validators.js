import { body, param, query } from "express-validator";

export const idParamValidator = [
  param("id").isMongoId().withMessage("Invalid order id"),
];

export const itemIdParamValidator = [
  param("id").isMongoId().withMessage("Invalid order id"),
  param("itemId").isMongoId().withMessage("Invalid item id"),
];

export const createOrderValidator = [
  body("dueDate").isISO8601().withMessage("Invalid due date format"),
  body("receivedThrough")
    .isIn(["FACEBOOK", "WHATSAPP", "PHONE", "IN_PERSON", "EMAIL"])
    .withMessage("Invalid received through value"),
  body("status")
    .optional()
    .isIn(["TO_DO", "READY_TO_BE_TAKEN", "IN_EXECUTION", "IN_PAUSE", "IN_PROGRESS", "DONE", "CANCELLED"])
    .withMessage("Invalid status"),
  body("customer").isMongoId().withMessage("Invalid customer ID"),
  body("customerCompany").optional({ checkFalsy: true }).isMongoId().withMessage("Invalid customer company ID"),
  body("priority")
    .optional()
    .isIn(["LOW", "NORMAL", "HIGH", "URGENT"])
    .withMessage("Invalid priority"),
  body("description").optional({ checkFalsy: true }).isString().trim(),
  // Items validation - handle both array and JSON string
  body("items").custom((value) => {
    let items;
    if (typeof value === 'string') {
      try {
        items = JSON.parse(value);
      } catch (e) {
        throw new Error('Items must be valid JSON');
      }
    } else {
      items = value;
    }
    
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('At least one item is required');
    }
    
    // Validate each item
    items.forEach((item, index) => {
      if (!item.product || typeof item.product !== 'string') {
        throw new Error(`Item ${index}: Invalid product ID`);
      }
      if (!item.productNameSnapshot || typeof item.productNameSnapshot !== 'string') {
        throw new Error(`Item ${index}: Product name snapshot is required`);
      }
      if (item.quantity && (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
        throw new Error(`Item ${index}: Quantity must be at least 1`);
      }
    });
    
    return true;
  })
];

export const updateOrderValidator = [
  body("dueDate").optional().isISO8601().withMessage("Invalid due date format"),
  body("receivedThrough")
    .optional()
    .isIn(["FACEBOOK", "WHATSAPP", "PHONE", "IN_PERSON", "EMAIL"])
    .withMessage("Invalid received through value"),
  body("status")
    .optional()
    .isIn(["TO_DO", "READY_TO_BE_TAKEN", "IN_EXECUTION", "IN_PAUSE", "IN_PROGRESS", "DONE", "CANCELLED"])
    .withMessage("Invalid status"),
  body("customer").optional().isMongoId().withMessage("Invalid customer ID"),
  body("customerCompany").optional({ checkFalsy: true }).isMongoId().withMessage("Invalid customer company ID"),
  body("priority")
    .optional()
    .isIn(["LOW", "NORMAL", "HIGH", "URGENT"])
    .withMessage("Invalid priority"),
  body("description").optional({ checkFalsy: true }).isString().trim(),
  // Items validation - handle both array and JSON string (optional for updates)
  body("items").optional().custom((value) => {
    if (!value) return true; // Optional field
    
    let items;
    if (typeof value === 'string') {
      try {
        items = JSON.parse(value);
      } catch (e) {
        throw new Error('Items must be valid JSON');
      }
    } else {
      items = value;
    }
    
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }
    
    // Validate each item
    items.forEach((item, index) => {
      if (item.product && typeof item.product !== 'string') {
        throw new Error(`Item ${index}: Invalid product ID`);
      }
      if (item.productNameSnapshot && typeof item.productNameSnapshot !== 'string') {
        throw new Error(`Item ${index}: Product name snapshot must be a string`);
      }
      if (item.quantity && (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
        throw new Error(`Item ${index}: Quantity must be at least 1`);
      }
    });
    
    return true;
  })
];

export const updateOrderStatusValidator = [
  body("status")
    .isIn(["TO_DO", "READY_TO_BE_TAKEN", "IN_EXECUTION", "IN_PAUSE", "IN_PROGRESS", "DONE", "CANCELLED"])
    .withMessage("Invalid status"),
];

export const updateItemStatusValidator = [
  body("itemStatus")
    .isIn(["TO_DO", "GRAPHICS", "PRINTING", "CUTTING", "FINISHING", "PACKING", "DONE", "STANDBY", "CANCELLED"])
    .withMessage("Invalid item status"),
];

export const listOrdersValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("sort").optional().isString(),
  query("search").optional().isString().trim(),
  query("status")
    .optional()
    .isIn(["TO_DO", "READY_TO_BE_TAKEN", "IN_EXECUTION", "IN_PAUSE", "IN_PROGRESS", "DONE", "CANCELLED"])
    .withMessage("Invalid status filter"),
  query("priority")
    .optional()
    .isIn(["LOW", "NORMAL", "HIGH", "URGENT"])
    .withMessage("Invalid priority filter"),
  query("customer").optional().isMongoId().withMessage("Invalid customer ID filter"),
];
