import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    cui: { type: String, trim: true },                              // optional CUI - not all companies have one
    defaultFolderPath: { type: String, trim: true },                // default folder path for company files
    description: { type: String, trim: true },                      // optional description
  },
  { timestamps: true }
);

// Indexes per spec
companySchema.index({ name: 1 });
companySchema.index({ cui: 1 }, { sparse: true, unique: true }); // CUI is unique when provided, but optional
companySchema.index({
  name: "text",
  cui: "text",
  description: "text",
});

const Company = mongoose.model("Company", companySchema);
export default Company;
