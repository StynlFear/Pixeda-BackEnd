import { validationResult } from "express-validator";
import Company from "../../models/company/company.model.js";

const bailIfInvalid = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
};

export const listCompanies = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 100);
    const sort = req.query.sort ?? "-createdAt";
    const search = (req.query.search ?? "").trim();

    const q = search ? { $text: { $search: search } } : {};

    const [items, total] = await Promise.all([
      Company.find(q)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Company.countDocuments(q),
    ]);

    res.json({ total, page, limit, sort, items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getCompany = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const doc = await Company.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: "Company not found" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const createCompany = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const doc = await Company.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(400).json({ error: "Duplicate CUI", details: e.keyValue });
    }
    res.status(500).json({ error: e.message });
  }
};

export const updateCompany = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const doc = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ error: "Company not found" });
    res.json(doc);
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(400).json({ error: "Duplicate CUI", details: e.keyValue });
    }
    res.status(500).json({ error: e.message });
  }
};

export const deleteCompany = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const doc = await Company.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Company not found" });
    res.json({ message: "Company deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
