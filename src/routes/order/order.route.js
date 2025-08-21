import { Router } from "express";
import {
  createOrder,
  listOrders,
  getOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  updateItemStatus,
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
router.get("/:id", idParamValidator, handleValidation, getOrder);
router.put("/:id", uploadOrderItemImages, handleUploadError, idParamValidator, updateOrderValidator, handleValidation, updateOrder);
router.delete("/:id", idParamValidator, handleValidation, deleteOrder);

// Additional order management endpoints
router.patch("/:id/status", idParamValidator, updateOrderStatusValidator, handleValidation, updateOrderStatus);
router.patch("/:id/items/:itemId/status", itemIdParamValidator, updateItemStatusValidator, handleValidation, updateItemStatus);

export default router;
