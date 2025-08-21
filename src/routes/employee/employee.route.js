import { Router } from "express";
import {
  createEmployee,
  listEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee
} from "../../controllers/employee/employee.controller.js";
import { handleValidation } from "../../middlewares/handleValidation.js";
import {
  createEmployeeValidator,
  updateEmployeeValidator,
  idParamValidator,
  listEmployeesValidator
} from "../../validators/employee.validators.js";

const router = Router();

router.post("/", createEmployeeValidator, handleValidation, createEmployee);
router.get("/", listEmployeesValidator, handleValidation, listEmployees);
router.get("/:id", idParamValidator, handleValidation, getEmployee);
router.put("/:id", idParamValidator, updateEmployeeValidator, handleValidation, updateEmployee);
router.delete("/:id", idParamValidator, handleValidation, deleteEmployee);

export default router;
