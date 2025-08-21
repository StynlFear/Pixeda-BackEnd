import { Router } from "express";
import {
  createOrder,
  listOrders,
  getOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  updateItemStatus,
  exportOrderAsPDF,
  previewOrderHTML,
} from "../../controllers/order/order.controller.js";
import { handleValidation } from "../../middlewares/handleValidation.js";
import { uploadOrderItemImages, handleUploadError } from "../../middlewares/upload.js";
import {
  createOrderValidator,
  updateOrderValidator,
  idParamValidator,
  itemIdParamValidator,
  listOrdersValidator,
  updateOrderStatusValidator,
  updateItemStatusValidator,
} from "../../validators/order.validators.js";

const router = Router();

// Main CRUD operations
router.post("/", uploadOrderItemImages, handleUploadError, createOrderValidator, handleValidation, createOrder);
router.get("/", listOrdersValidator, handleValidation, listOrders);

// PDF export (must be before /:id route to avoid conflicts)
router.get("/:id/pdf", idParamValidator, handleValidation, exportOrderAsPDF);
router.get("/:id/preview", idParamValidator, handleValidation, previewOrderHTML);

router.get("/:id", idParamValidator, handleValidation, getOrder);
router.put("/:id", uploadOrderItemImages, handleUploadError, idParamValidator, updateOrderValidator, handleValidation, updateOrder);
router.delete("/:id", idParamValidator, handleValidation, deleteOrder);

// Additional order management endpoints
router.patch("/:id/status", idParamValidator, updateOrderStatusValidator, handleValidation, updateOrderStatus);
router.patch("/:id/items/:itemId/status", itemIdParamValidator, updateItemStatusValidator, handleValidation, updateItemStatus);

export default router;
