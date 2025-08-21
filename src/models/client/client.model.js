import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    companies: [{                                           // optional - client can have no companies
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    }],
    phone: { type: String, trim: true },                    // optional phone number
    whatsapp: { type: String, trim: true },                // optional WhatsApp number
    email: { type: String, trim: true, lowercase: true },    // optional
    defaultFolderPath: { type: String, trim: true },    // folder path for personal orders (when not ordering through a company)
  },
  { timestamps: true }
);
// Indexes per spec
clientSchema.index({ lastName: 1, firstName: 1 });
clientSchema.index({
  firstName: "text",
  lastName: "text",
  email: "text",
  phone: "text",
  whatsapp: "text",
});

const Client = mongoose.model("Client", clientSchema);
export default Client;
