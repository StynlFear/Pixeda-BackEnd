// routes/product/product.routes.js
import { Router } from "express";
import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from "../../controllers/product/product.controllers.js";
import { handleValidation } from "../../middlewares/handleValidation.js";
import {
  // alias your existing rule exports to the same naming used by employees
  createProductRules as createProductValidator,
  updateProductRules as updateProductValidator,
  listQueryRules as listProductsValidator,
  idParamRule as idParamValidator,
} from "../../validators/product.validators.js";

const router = Router();

router.post("/", createProductValidator, handleValidation, createProduct);
router.get("/", listProductsValidator, handleValidation, listProducts);
router.get("/:id", idParamValidator, handleValidation, getProduct);
router.put("/:id", idParamValidator, updateProductValidator, handleValidation, updateProduct);
router.delete("/:id", idParamValidator, handleValidation, deleteProduct);

export default router;
