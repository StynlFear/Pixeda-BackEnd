import mongoose from "mongoose";

const MaterialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, minlength: 1 }
  },
  { timestamps: true }
);

export const Material = mongoose.model("Material", MaterialSchema);
