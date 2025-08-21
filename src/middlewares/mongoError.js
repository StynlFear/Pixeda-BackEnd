export function mongoErrorHandler(err, req, res, next) {
  // Duplicate key
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({ message: `${field} already exists`, key: err.keyValue });
  }
  return next(err);
}
