import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  productNameSnapshot: { type: String, trim: true },
  descriptionSnapshot: { type: String, trim: true },
  priceSnapshot: { type: Number, min: 0 },
  quantity: { type: Number, min: 1, default: 1 },
  itemStatus: {
    type: String,
    enum: ["TO_DO", "GRAPHICS", "PRINTING", "CUTTING", "FINISHING", "PACKING", "DONE", "STANDBY", "CANCELLED"],
    default: "TO_DO"
  },
  attachments: [{ type: String }], // file paths or URLs
  graphicsImage: { type: String }, // file path or URL
  finishedProductImage: { type: String }, // file path or URL
  textToPrint: { type: String, trim: true },
  editableFilePath: { type: String, trim: true },
  printingFilePath: { type: String, trim: true },
  disabledStages: [{
    type: String,
    enum: ["TO_DO", "GRAPHICS", "PRINTING", "CUTTING", "FINISHING", "PACKING", "DONE", "STANDBY", "CANCELLED"]
  }],
  assignments: [{
    stage: {
      type: String,
      enum: ["TO_DO", "GRAPHICS", "PRINTING", "CUTTING", "FINISHING", "PACKING", "DONE", "STANDBY", "CANCELLED"]
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    stageNotes: { type: String, trim: true },
    assignedAt: { type: Date, default: Date.now },
    startedAt: { type: Date }, // When employee started working on this stage
    completedAt: { type: Date }, // When employee finished this stage
    timeSpent: { type: Number }, // Calculated field: milliseconds spent on this assignment
    isActive: { type: Boolean, default: true } // False when assignment is completed or reassigned
  }]
});

const orderSchema = new mongoose.Schema(
  {
    dueDate: { type: Date },
    receivedThrough: {
      type: String,
      enum: ["FACEBOOK", "WHATSAPP", "PHONE", "IN_PERSON", "EMAIL"]
    },
    status: {
      type: String,
      enum: ["TO_DO", "READY_TO_BE_TAKEN", "IN_EXECUTION", "IN_PAUSE", "IN_PROGRESS", "DONE", "CANCELLED"],
      default: "TO_DO"
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
    customerCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
      default: "NORMAL"
    },
    description: { type: String, trim: true },
    items: [orderItemSchema]
  },
  { timestamps: true }
);

// Indexes for performance
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ priority: 1 });
orderSchema.index({ dueDate: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "items.assignments.assignedTo": 1 });

// Text search index
orderSchema.index({
  description: "text",
  "items.productNameSnapshot": "text",
  "items.descriptionSnapshot": "text",
  "items.textToPrint": "text"
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
