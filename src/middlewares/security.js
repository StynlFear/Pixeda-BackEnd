import helmet from "helmet";
import rateLimit from "express-rate-limit";

export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 10,                   // max 10 încercări per IP/10min
  standardHeaders: true,
  legacyHeaders: false,
});
