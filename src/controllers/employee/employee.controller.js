import { Employee } from "../../models/employee/employee.model.js";
import bcrypt from "bcryptjs";

export async function createEmployee(req, res, next) {
  try {
    const { firstName, lastName, email, phone, position, password, hireDate } = req.body;
    const employee = await Employee.create({ firstName, lastName, email, phone, position, password, hireDate });
    const { password: _p, ...safe } = employee.toObject();
    res.status(201).json(safe);
  } catch (err) { next(err); }
}

export async function listEmployees(req, res, next) {
  try {
    const { q = "", page = 1, limit = 10, sortBy = "createdAt", order = "desc" } = req.query;
    const filter = q
      ? { $or: [
          { firstName: new RegExp(q, "i") },
          { lastName: new RegExp(q, "i") },
          { email: new RegExp(q, "i") },
          { phone: new RegExp(q, "i") }
        ] }
      : {};
    const sort = { [sortBy]: order === "asc" ? 1 : -1 };

    const [items, total] = await Promise.all([
      Employee.find(filter).sort(sort).skip((page - 1) * limit).limit(Number(limit)).lean(),
      Employee.countDocuments(filter)
    ]);

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

export async function getEmployee(req, res, next) {
  try {
    const emp = await Employee.findById(req.params.id).lean();
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.json(emp);
  } catch (err) { next(err); }
}

export async function updateEmployee(req, res, next) {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }
    const emp = await Employee.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true, lean: true });
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.json(emp);
  } catch (err) { next(err); }
}

export async function deleteEmployee(req, res, next) {
  try {
    const emp = await Employee.findByIdAndDelete(req.params.id).lean();
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
