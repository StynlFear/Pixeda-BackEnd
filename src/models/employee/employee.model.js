import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const EmployeeSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, minlength: 2 },
    lastName:  { type: String, required: true, trim: true, minlength: 2 },
    email:     { type: String, required: true, trim: true, lowercase: true, unique: true },
    phone:     { type: String, trim: true },
    position:  { type: String, enum: ["employee", "admin"], required: true, default: "employee" },
    password:  { type: String, required: true, minlength: 6, select: false },
    hireDate:  { type: Date }
  },
  { timestamps: true }
);

// index explicit (pe lângă unique:true din schemă) — mai robust la sync
EmployeeSchema.index({ email: 1 }, { unique: true });

EmployeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

EmployeeSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const Employee = mongoose.model("Employee", EmployeeSchema);
