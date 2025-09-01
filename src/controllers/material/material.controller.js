export async function listMaterials(req, res, next) {
  try {
    const items = await Material.find().sort({ name: 1 }).lean();
    res.json({ items });
  } catch (err) { next(err); }
}
import { Material } from "../../models/material/material.model.js";

export async function createMaterial(req, res, next) {
  try {
    const { name } = req.body;
    const doc = await Material.create({ name });
    res.status(201).json(doc.toObject());
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "Material already exists" });
    next(err);
  }
}

export async function deleteMaterial(req, res, next) {
  try {
    const doc = await Material.findByIdAndDelete(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Material not found" });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
