import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "Employee", index: true, required: true },
    tokenHash: { type: String, required: true, index: true }, // hash(refreshToken)
    userAgent: { type: String },
    ip:        { type: String },
    expiresAt: { type: Date, required: true, index: 1 },
    revokedAt: { type: Date }
  },
  { timestamps: true }
);

// expirare automată (TTL) dacă vrei, alternativ poți folosi un job
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model("Session", SessionSchema);
