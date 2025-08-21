import { Router } from "express";
import {
  createClient,
  listClients,
  getClient,
  updateClient,
  deleteClient,
} from "../../controllers/client/client.controllers.js";
import { handleValidation } from "../../middlewares/handleValidation.js";
import {
  createClientValidator,
  updateClientValidator,
  idParamValidator,
  listClientsValidator,
} from "../../validators/client.validators.js";

const router = Router();

router.post("/", createClientValidator, handleValidation, createClient);
router.get("/", listClientsValidator, handleValidation, listClients);
router.get("/:id", idParamValidator, handleValidation, getClient);
router.put("/:id", idParamValidator, updateClientValidator, handleValidation, updateClient);
router.delete("/:id", idParamValidator, handleValidation, deleteClient);

export default router;
