import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(uri) {
  if (isConnected) return mongoose.connection;

  mongoose.connection.on("connected", () => {
    console.log(`✅ MongoDB connected: ${mongoose.connection.name}`);
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected");
  });

  // recomandare pentru timeouts curate în dev
  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    // opțiuni safe pentru Mongoose 8
    autoIndex: true,
    serverSelectionTimeoutMS: 10000
  });

  isConnected = true;
  return mongoose.connection;
}

export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}
