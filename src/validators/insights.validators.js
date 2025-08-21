import { query } from "express-validator";

export const insightsQueryValidator = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date")
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end <= start) {
          throw new Error("End date must be after start date");
        }
      }
      return true;
    }),
  
  query("period")
    .optional()
    .isIn(["7d", "30d", "90d", "1y"])
    .withMessage("Period must be one of: 7d, 30d, 90d, 1y"),
  
  query("employeeId")
    .optional()
    .isMongoId()
    .withMessage("Employee ID must be a valid MongoDB ObjectId"),
  
  query("clientId")
    .optional()
    .isMongoId()
    .withMessage("Client ID must be a valid MongoDB ObjectId"),
  
  query("productId")
    .optional()
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
  
  query("status")
    .optional()
    .isIn(["TO_DO", "READY_TO_BE_TAKEN", "IN_EXECUTION", "IN_PAUSE", "IN_PROGRESS", "DONE", "CANCELLED"])
    .withMessage("Status must be a valid order status"),
  
  query("priority")
    .optional()
    .isIn(["LOW", "NORMAL", "HIGH", "URGENT"])
    .withMessage("Priority must be one of: LOW, NORMAL, HIGH, URGENT"),
    
  query("itemStatus")
    .optional()
    .isIn(["TO_DO", "GRAPHICS", "PRINTING", "CUTTING", "FINISHING", "PACKING", "DONE", "STANDBY", "CANCELLED"])
    .withMessage("Item status must be a valid order item status")
];
