import "dotenv/config.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { Employee } from "./models/employee/employee.model.js";

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

(async () => {
  try {
    await connectDB(MONGO_URI);

    // asigură index-urile (inclusiv unique pe email)
    await Employee.syncIndexes();

    const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server ready on port ${PORT}`);
});


    const shutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down...`);
      server.close(() => process.exit(0));
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
})();
