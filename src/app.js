import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { securityHeaders } from "./middlewares/security.js";
import { mongoErrorHandler } from "./middlewares/mongoError.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import employeeRoutes from "./routes/employee/employee.route.js";
import authRoutes from "./routes/auth/auth.route.js";
import clientsRoutes from "./routes/client/client.route.js";
import productRoutes from "./routes/product/product.route.js";
import companyRoutes from "./routes/company/company.route.js";
import orderRoutes from "./routes/order/order.route.js";
import uploadsRoutes from "./routes/uploads/uploads.route.js";
import insightsRoutes from "./routes/insights/insights.route.js";

import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "./docs/openapi.js";

const app = express();

// middlewares de bază
app.use(securityHeaders);
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ["http://localhost:3000"];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, 
  optionsSuccessStatus: 200 // For legacy browser support
}))
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, {
    customSiteTitle: "Pixeda API Docs",
    swaggerOptions: {
      persistAuthorization: true,
      // include cookies for same-origin calls (helps with /auth/refresh)
      requestInterceptor: (req) => { req.credentials = "include"; return req; }
    }
  })
);
// healthcheck simplu (verificăm rapid că API-ul răspunde)
app.get("/health", (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});
app.use("/api/employees", employeeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/products", productRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/insights", insightsRoutes);
app.use(mongoErrorHandler);
// fallback generic
app.use(errorHandler);
export default app;
