import { validationResult } from "express-validator";
import Client from "../../models/client/client.model.js";

const bailIfInvalid = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
};

export const listClients = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 100);
    const sort = req.query.sort ?? "-createdAt";
    const search = (req.query.search ?? "").trim();

    const q = search ? { $text: { $search: search } } : {};

    const [items, total] = await Promise.all([
      Client.find(q)
        .populate('companies', 'name cui')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Client.countDocuments(q),
    ]);

    res.json({ total, page, limit, sort, items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getClient = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const doc = await Client.findById(req.params.id).populate('companies').lean();
    if (!doc) return res.status(404).json({ error: "Client not found" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const createClient = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const doc = await Client.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(400).json({ error: "Duplicate key", details: e.keyValue });
    }
    res.status(500).json({ error: e.message });
  }
};

export const updateClient = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const doc = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ error: "Client not found" });
    res.json(doc);
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(400).json({ error: "Duplicate key", details: e.keyValue });
    }
    res.status(500).json({ error: e.message });
  }
};

export const deleteClient = async (req, res) => {
  if (bailIfInvalid(req, res)) return;

  try {
    const doc = await Client.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Client not found" });
    res.json({ message: "Client deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
