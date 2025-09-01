import { Product } from "../../models/product/product.model.js";

// Helpers
function parseSort(sortBy = "createdAt", order = "desc") {
  return { [sortBy]: String(order).toLowerCase() === "asc" ? 1 : -1 };
}

export async function createProduct(req, res, next) {
  try {
    const { type, productName, productCode, description, materials, price } = req.body;
    const doc = await Product.create({
      type: type || undefined,
      productName,
      productCode,
      description: description || undefined,
      materials: Array.isArray(materials) ? materials : (materials ? [materials] : undefined),
      price: price === undefined || price === null ? undefined : Number(price)
    });
    const populated = await Product.findById(doc._id).populate("materials").lean();
    res.status(201).json(populated);
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "productCode already exists" });
    next(err);
  }
}

export async function listProducts(req, res, next) {
  try {
    const {
      q = "",
  type,
  materials,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (materials) {
      // materials can be comma-separated list of ids; filter products that have ANY of these materials
      const ids = String(materials).split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length) filter.materials = { $in: ids };
    }
    if (q) filter.$text = { $search: q };

    const sort = q
      ? { score: { $meta: "textScore" }, ...parseSort(sortBy, order) }
      : parseSort(sortBy, order);

    const skip = (Number(page) - 1) * Number(limit);

  const query = Product.find(filter).sort(sort).skip(skip).limit(Number(limit)).populate("materials");
    if (q) query.select({ score: { $meta: "textScore" } });

    const [items, total] = await Promise.all([
      query.lean(),
      Product.countDocuments(filter)
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) { next(err); }
}

export async function getProduct(req, res, next) {
  try {
  const doc = await Product.findById(req.params.id).populate("materials").lean();
    if (!doc) return res.status(404).json({ message: "Product not found" });
    res.json(doc);
  } catch (err) { next(err); }
}

export async function updateProduct(req, res, next) {
  try {
    const updates = { ...req.body };
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.materials !== undefined) {
      updates.materials = Array.isArray(updates.materials)
        ? updates.materials
        : (updates.materials ? [updates.materials] : []);
    }

    const doc = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: "Product not found" });
  const populated = await Product.findById(doc._id).populate("materials").lean();
    res.json(populated);
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "productCode already exists" });
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const doc = await Product.findByIdAndDelete(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Product not found" });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
