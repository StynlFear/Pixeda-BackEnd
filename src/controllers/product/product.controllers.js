import { Product } from "../../models/product/product.model.js";

// Helpers
function parseSort(sortBy = "createdAt", order = "desc") {
  return { [sortBy]: String(order).toLowerCase() === "asc" ? 1 : -1 };
}

export async function createProduct(req, res, next) {
  try {
    const { type, productName, productCode, description, price } = req.body;
    const doc = await Product.create({
      type: type || undefined,
      productName,
      productCode,
      description: description || undefined,
      price: price === undefined || price === null ? undefined : Number(price)
    });
    res.status(201).json(doc.toObject());
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
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (q) filter.$text = { $search: q };

    const sort = q
      ? { score: { $meta: "textScore" }, ...parseSort(sortBy, order) }
      : parseSort(sortBy, order);

    const skip = (Number(page) - 1) * Number(limit);

    const query = Product.find(filter).sort(sort).skip(skip).limit(Number(limit));
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
    const doc = await Product.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Product not found" });
    res.json(doc);
  } catch (err) { next(err); }
}

export async function updateProduct(req, res, next) {
  try {
    const updates = { ...req.body };
    if (updates.price !== undefined) updates.price = Number(updates.price);

    const doc = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true, lean: true }
    );
    if (!doc) return res.status(404).json({ message: "Product not found" });
    res.json(doc);
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
