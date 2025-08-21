import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    type:        { type: String, trim: true },
    productName: { type: String, required: true, trim: true, minlength: 2 },
    productCode: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    price:       { type: Number, min: 0 }
  },
  { timestamps: true }
);

// Indexes (unique + text search)

export const Product = mongoose.model("Product", ProductSchema);
