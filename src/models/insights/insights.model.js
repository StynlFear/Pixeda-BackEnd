import mongoose from "mongoose";

// This model is primarily for caching computed insights if needed
// Most insights will be computed on-demand from existing collections
const insightsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "daily_summary",
        "weekly_summary", 
        "monthly_summary",
        "employee_performance",
        "client_analysis",
        "product_trends"
      ],
      required: true
    },
    period: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // Flexible storage for computed insights
      required: true
    },
    computedAt: { type: Date, default: Date.now },
    // Optional filters that were applied when computing this insight
    filters: {
      employeeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
      clientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Client' }],
      productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      statuses: [String],
      priorities: [String]
    }
  },
  { timestamps: true }
);

// Indexes for efficient querying
insightsSchema.index({ type: 1, "period.startDate": 1, "period.endDate": 1 });
insightsSchema.index({ computedAt: -1 });
insightsSchema.index({ type: 1, computedAt: -1 });

const Insights = mongoose.model("Insights", insightsSchema);
export default Insights;
