import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    type:        { type: String, trim: true },
    productName: { type: String, required: true, trim: true, minlength: 2 },
    productCode: { type: String, trim: true, unique: true },
  description: { type: String, trim: true },
  materials:   [{ type: mongoose.Schema.Types.ObjectId, ref: "Material" }],
    price:       { type: Number, min: 0 }
  },
  { timestamps: true }
);

// Indexes (unique + text search)
ProductSchema.index({ productName: "text", productCode: "text", description: "text" });

export const Product = mongoose.model("Product", ProductSchema);
